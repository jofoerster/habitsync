package de.jofoerster.habitsync.config;

import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.auth.TokenService;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.MediaType;
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
import java.util.List;
import java.util.Map;
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
        Map<String, JwtDecoder> jwtDecoders = securityProperties.getIssuers().entrySet().stream()
                .collect(Collectors.toMap(
                        entry -> entry.getValue().getUrl(),
                        entry -> JwtDecoders.fromIssuerLocation(entry.getValue().getUrl())
                ));

        String customIssuer = baseUrl;
        JwtDecoder customJwtDecoder = tokenService.getCustomJwtDecoder();
        jwtDecoders.put(customIssuer, customJwtDecoder);

        return new JwtIssuerAuthenticationManagerResolver(
                issuer -> {
                    JwtDecoder decoder = jwtDecoders.get(issuer);
                    if (decoder != null) {
                        JwtAuthenticationProvider provider = new JwtAuthenticationProvider(decoder);
                        return provider::authenticate;
                    }
                    return null;
                }
        );
    }

    private AuthorizationDecision checkUserAccess(java.util.function.Supplier<Authentication> authSupplier,
                                                  RequestAuthorizationContext context) {
        Authentication auth = authSupplier.get();
        List<String> allowedURIs = List.of("/api/user/refresh-token");
        boolean granted = true;
        if (!allowedURIs.contains(context.getRequest().getRequestURI())) {
            granted = accountService.isUserAllowed(auth);
        }
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