package de.jofoerster.habitsync.config;

import io.swagger.v3.oas.models.Components;
import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.security.OAuthFlow;
import io.swagger.v3.oas.models.security.OAuthFlows;
import io.swagger.v3.oas.models.security.SecurityScheme;
import io.swagger.v3.oas.models.servers.Server;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.List;

@Configuration
public class OpenApiConfig {


    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
                .info(apiInfo())
                .servers(List.of(
                        new Server().url("/").description("Default Server URL")
                ))
                .components(new Components()
                        .addSecuritySchemes("apiKey", apiKeySecurityScheme())
                        .addSecuritySchemes("bearerAuth", bearerAuthSecurityScheme())
                        .addSecuritySchemes("basicAuth", basicAuthSecurityScheme())
                        .addSecuritySchemes("oauth2", oauth2SecurityScheme())
                );
    }

    private Info apiInfo() {
        return new Info()
                .title("HabitSync API")
                .description("""
                        HabitSync is a habit tracker with sharing and challenge functions.
                        
                        ## Authentication
                        
                        This API supports multiple authentication methods:
                        
                        - **API Key**: Pass your API key in the `X-API-Key` header
                        - **Bearer Token (JWT)**: Pass your JWT token in the `Authorization` header as `Bearer <token>`
                        - **Basic Auth**: Use HTTP Basic Authentication with username and password
                        - **OAuth2**: Use OAuth2 authentication flow
                        
                        ## Public Endpoints
                        
                        Endpoints under `/api/auth/**` and `/api/public/**` do not require authentication.
                        
                        ## Rate Limiting
                        
                        Currently, there are no rate limits enforced on the API.
                        """);
    }

    private SecurityScheme apiKeySecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.APIKEY)
                .in(SecurityScheme.In.HEADER)
                .name("X-API-Key")
                .description("API Key authentication. Obtain your API key from the user settings.");
    }

    private SecurityScheme bearerAuthSecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("bearer")
                .bearerFormat("JWT")
                .description("JWT Bearer token authentication. Use the refresh-token endpoint to obtain tokens.");
    }

    private SecurityScheme basicAuthSecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.HTTP)
                .scheme("basic")
                .description("HTTP Basic authentication. Use username and password.");
    }

    private SecurityScheme oauth2SecurityScheme() {
        return new SecurityScheme()
                .type(SecurityScheme.Type.OAUTH2)
                .description("OAuth2 authentication with external identity providers.")
                .flows(new OAuthFlows()
                        .authorizationCode(new OAuthFlow()
                                .authorizationUrl("/oauth2/authorize")
                                .tokenUrl("/oauth2/token")
                        )
                );
    }
}

