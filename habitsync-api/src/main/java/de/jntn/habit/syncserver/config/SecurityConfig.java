package de.jntn.habit.syncserver.config;

import de.jntn.habit.syncserver.service.account.AccountService;
import de.jntn.habit.syncserver.service.auth.TokenService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
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
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.access.intercept.RequestAuthorizationContext;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.time.Duration;
import java.util.Map;
import java.util.stream.Collectors;

@RequiredArgsConstructor
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final AccountService accountService;
    private final SecurityProperties securityProperties;
    private final TokenService tokenService;

    @Value("${base.url}")
    String baseUrl;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        JwtIssuerAuthenticationManagerResolver authenticationManagerResolver = createAuthenticationManagerResolver();

        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(cors -> cors.configurationSource(corsConfigurationSource()))
                .userDetailsService(userDetailsService())
                .oauth2ResourceServer(oauth2 -> oauth2
                        .authenticationManagerResolver(authenticationManagerResolver)
                )
                .authorizeHttpRequests(authz -> authz
                        .requestMatchers("/actuator/health", "/actuator/info").permitAll()
                        .requestMatchers("/auth/**").permitAll()
                        .requestMatchers("/**").access(this::checkUserAccess)
                );

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
                        .password("{noop}" + basicAuthUsers.get(username))
                        .authorities("USER")
                        .build();
            }

            throw new UsernameNotFoundException("User not found: " + username);
        };
    }
}