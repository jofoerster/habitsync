package de.jofoerster.habitsync;

import org.h2.tools.Server;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;

import java.sql.SQLException;
import java.util.TimeZone;


@EnableScheduling
@EnableAsync
@SpringBootApplication
public class SyncserverApplication {

    public static void main(String[] args) throws SQLException {
        TimeZone.setDefault(TimeZone.getTimeZone("Europe/Paris"));
        Server.createTcpServer("-tcp", "-tcpAllowOthers", "-ifNotExists")
                .start();
        SpringApplication.run(SyncserverApplication.class, args);
    }

}
