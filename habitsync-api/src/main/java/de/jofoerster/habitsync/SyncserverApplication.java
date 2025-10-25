package de.jofoerster.habitsync;

import io.swagger.v3.oas.annotations.OpenAPIDefinition;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeIn;
import io.swagger.v3.oas.annotations.enums.SecuritySchemeType;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityScheme;
import io.swagger.v3.oas.annotations.servers.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.sql.SQLException;
import java.util.TimeZone;

@OpenAPIDefinition(
        servers = {
                @Server(url = "/", description = "Default Server URL")
        },
        security = {
                @SecurityRequirement(name = "apiToken")
        }
)
@SecurityScheme(
        name = "apiToken",
        type = SecuritySchemeType.APIKEY,
        in = SecuritySchemeIn.HEADER,
        paramName = "X-API-Key"
)
@EnableScheduling
@EnableAsync
@EnableCaching
@SpringBootApplication
public class SyncserverApplication {

    public static void main(String[] args) throws SQLException {
        org.h2.tools.Server.createTcpServer("-tcp", "-tcpAllowOthers", "-ifNotExists")
                .start();
        SpringApplication.run(SyncserverApplication.class, args);
    }

}
