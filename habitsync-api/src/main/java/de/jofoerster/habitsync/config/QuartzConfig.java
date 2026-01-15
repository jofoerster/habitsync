package de.jofoerster.habitsync.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

import javax.sql.DataSource;
import java.util.Properties;

@Configuration
public class QuartzConfig {

    @Autowired
    private AutowiringSpringBeanJobFactory jobFactory;

    @Autowired
    private DataSource dataSource;

    @Value("${spring.datasource.url:}")
    private String datasourceUrl;

    @Bean
    public SchedulerFactoryBean schedulerFactoryBean() {
        SchedulerFactoryBean factory = new SchedulerFactoryBean();
        factory.setJobFactory(jobFactory);
        factory.setDataSource(dataSource);
        factory.setOverwriteExistingJobs(true);
        factory.setStartupDelay(20);
        factory.setQuartzProperties(quartzProperties());
        return factory;
    }

    private Properties quartzProperties() {
        Properties properties = new Properties();
        properties.setProperty("org.quartz.jobStore.driverDelegateClass", getDriverDelegateClass());
        return properties;
    }

    private String getDriverDelegateClass() {
        if (datasourceUrl != null && datasourceUrl.startsWith("jdbc:postgresql")) {
            return "org.quartz.impl.jdbcjobstore.PostgreSQLDelegate";
        }
        return "org.quartz.impl.jdbcjobstore.StdJDBCDelegate";
    }
}
