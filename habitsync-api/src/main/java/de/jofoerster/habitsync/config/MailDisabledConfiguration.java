package de.jofoerster.habitsync.config;

import org.springframework.boot.autoconfigure.EnableAutoConfiguration;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.boot.autoconfigure.mail.MailSenderAutoConfiguration;
import org.springframework.context.annotation.Configuration;

@Configuration
@ConditionalOnProperty(name = "spring.mail.enabled", havingValue = "false")
@EnableAutoConfiguration(exclude = {MailSenderAutoConfiguration.class})
public class MailDisabledConfiguration {
    // This configuration will exclude mail auto-configuration when spring.mail.enabled=false
}
