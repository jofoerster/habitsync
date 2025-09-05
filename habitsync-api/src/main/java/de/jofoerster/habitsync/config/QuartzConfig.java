package de.jofoerster.habitsync.config;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.quartz.SchedulerFactoryBean;

import javax.sql.DataSource;

@Configuration
public class QuartzConfig {

    @Autowired
    private AutowiringSpringBeanJobFactory jobFactory;

    @Autowired
    private DataSource dataSource;

    @Bean
    public SchedulerFactoryBean schedulerFactoryBean() {
        SchedulerFactoryBean factory = new SchedulerFactoryBean();
        factory.setJobFactory(jobFactory);
        factory.setDataSource(dataSource);
        factory.setOverwriteExistingJobs(true);
        factory.setStartupDelay(20);
        return factory;
    }
}
