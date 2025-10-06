CREATE TABLE notification_rule_status
(
    rule_identifier VARCHAR(255) NOT NULL,
    is_active       BOOLEAN      NOT NULL,
    CONSTRAINT pk_notificationrulestatus PRIMARY KEY (rule_identifier)
);