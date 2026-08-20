package de.jofoerster.habitsync.config;

import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.auth.TokenService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationServiceException;
import org.springframework.security.authorization.AuthorizationDecision;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtDecoders;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationProvider;
import org.springframework.security.oauth2.server.resource.authentication.JwtIssuerAuthenticationManagerResolver;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AccountService accountService;
    private final SecurityProperties securityProperties;
    private final TokenService tokenService;
    private final ApiKeyAuthenticationFilter apiKeyAuthenticationFilter;

    @Value("${base.url}")
    String baseUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtIssuerAuthenticationManagerResolver authenticationManagerResolver = createAuthenticationManagerResolver();

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .addFilterBefore(apiKeyAuthenticationFilter, UsernamePasswordAuthenticationFilter.class)
                .userDetailsService(userDetailsService())
                .httpBasic(httpBasic -> httpBasic
                        .authenticationEntryPoint(customAuthenticationEntryPoint())
                )
                .oauth2ResourceServer(oauth2 -> oauth2
                        .authenticationManagerResolver(authenticationManagerResolver)
                        .authenticationEntryPoint(customAuthenticationEntryPoint())
                )
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers("/api/public/**").permitAll()
                        .requestMatchers("/api/**").access(this::checkUserAccess)
                        .requestMatchers("/h2-console/**").access(this::checkUserAccess)
                        .anyRequest().permitAll()
                )
                .exceptionHandling(ex ->
                        ex.authenticationEntryPoint(customAuthenticationEntryPoint()));

        return http.build();
    }

    private JwtIssuerAuthenticationManagerResolver createAuthenticationManagerResolver() {
        Map<String, AuthenticationManager> authenticationManagers = new ConcurrentHashMap<>();

        String customIssuer = baseUrl;
        JwtDecoder customJwtDecoder = tokenService.getCustomJwtDecoder();
        authenticationManagers.put(customIssuer, new JwtAuthenticationProvider(customJwtDecoder)::authenticate);

        Set<String> allowedIssuers = securityProperties.getIssuers().values().stream()
                .map(SecurityProperties.IssuerConfig::getUrl)
                .collect(Collectors.toSet());

        return new JwtIssuerAuthenticationManagerResolver(
                issuer -> {
                    if (customIssuer.equals(issuer) || allowedIssuers.contains(issuer)) {
                        return authenticationManagers.computeIfAbsent(issuer, key -> {
                            try {
                                JwtDecoder decoder = JwtDecoders.fromIssuerLocation(key);
                                JwtAuthenticationProvider provider = new JwtAuthenticationProvider(decoder);
                                return provider::authenticate;
                            } catch (Exception e) {
                                throw new AuthenticationServiceException("Unable to resolve issuer: " + key, e);
                            }
                        });
                    }
                    return null;
                }
        );
    }

    private AuthorizationDecision checkUserAccess(java.util.function.Supplier<? extends Authentication> authSupplier,
                                                  RequestAuthorizationContext context) {
        Authentication auth = authSupplier.get();
        boolean granted = accountService.isUserAllowed(auth);
        return new AuthorizationDecision(granted);
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowCredentials(true);
        configuration.addAllowedOriginPattern("*");
        configuration.addAllowedHeader("*");
        configuration.addAllowedMethod("*");
        configuration.setMaxAge(Duration.ofHours(1));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            Map<String, String> basicAuthUsers = securityProperties.getBasicAuthUsers();

            if (basicAuthUsers != null && basicAuthUsers.containsKey(username)) {
                return User.builder()
                        .username(username)
                        .password("{bcrypt}" + basicAuthUsers.get(username))
                        .authorities("USER")
                        .build();
            }

            throw new UsernameNotFoundException("User not found: " + username);
        };
    }

    @Bean
    public AuthenticationEntryPoint customAuthenticationEntryPoint() {
        return (request, response, authException) -> {
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
            response.getWriter()
                    .write("{\"error\": \"Unauthorized: Access is denied due to invalid credentials\"}");
        };
    }
}