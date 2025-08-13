
create sequence PUBLIC.CHALLENGE_SEQ
    increment by 50;

create sequence PUBLIC.VOTE_SEQ
    increment by 50;

create table PUBLIC.ACCOUNT
(
    AUTHENTICATION_ID                    CHARACTER VARYING(255) not null
        primary key,
    ACCOUNT_STATUS                       TINYINT,
    DISPLAY_NAME                         CHARACTER VARYING(255),
    EMAIL                                CHARACTER VARYING(255),
    NOTIFICATION_CREATION_FREQUENCY_DAYS INTEGER                not null,
    NOTIFICATION_CREATION_HOUR           INTEGER                not null,
    SEND_NOTIFICATIONS_VIA_EMAIL         BOOLEAN                not null,
    USER_NAME                            CHARACTER VARYING(255),
    ALLOWED_NOTIFICATIONS                TINYINT ARRAY,
    ENABLE_INTERNAL_HABIT_TRACKER        BOOLEAN,
    check ("ACCOUNT_STATUS" BETWEEN 0 AND 3)
);

create table PUBLIC.HABITS
(
    UUID                      CHARACTER VARYING(255) not null
        primary key,
    CHALLENGE_HABIT           BOOLEAN                not null,
    COLOR                     INTEGER,
    CREATET                   BIGINT,
    DAILY_GOAL                DOUBLE PRECISION,
    DAILY_GOAL_EXTRA          DOUBLE PRECISION,
    DAILY_GOAL_UNIT           CHARACTER VARYING(255),
    DESC                      CHARACTER VARYING(255),
    FREQ_CUSTOM               CHARACTER VARYING(255),
    FREQ_TYPE                 INTEGER,
    MODIFYT                   BIGINT,
    NAME                      CHARACTER VARYING(255),
    REMINDER_CUSTOM           CHARACTER VARYING(255),
    REMINDER_QUEST            CHARACTER VARYING(255),
    SORT_POSITION             DOUBLE PRECISION,
    START_DATE                INTEGER,
    STATUS                    INTEGER,
    TARGET_DAYS               INTEGER,
    TYPE                      INTEGER,
    ACCOUNT_AUTHENTICATION_ID CHARACTER VARYING(255),
    HABIT_TYPE                TINYINT,
    CONNECTED_SHARED_HABIT_ID BIGINT,
    constraint FKO2T92K7TNDMGH8PEHW6GR4LJ4
        foreign key (ACCOUNT_AUTHENTICATION_ID) references PUBLIC.ACCOUNT,
    check ("HABIT_TYPE" BETWEEN 0 AND 1)
);

create table PUBLIC.HABIT_NUMBER_MODAL_CONFIG
(
    HABIT_UUID       CHARACTER VARYING(255) not null
        primary key,
    CONFIG_VALUES    CHARACTER VARYING(255),
    STRING_DELIMITER CHARACTER VARYING(255)
);

create table PUBLIC.HABIT_RECORDS
(
    UUID         CHARACTER VARYING(255) not null
        primary key,
    CREATET      BIGINT,
    MODIFYT      BIGINT,
    PARENT_UUID  CHARACTER VARYING(255),
    REASON       CHARACTER VARYING(255),
    RECORD_DATE  INTEGER,
    RECORD_TYPE  INTEGER,
    RECORD_VALUE DOUBLE PRECISION,
    SESSION_ID   CHARACTER VARYING(255)
);

create table PUBLIC.NOTIFICATION
(
    ID                                 BIGINT auto_increment
        primary key,
    CONTENT                            CHARACTER VARYING,
    HTML_CONTENT_SHADE                 CHARACTER VARYING,
    HTML_CONTENT_SHADE_MINIMAL         CHARACTER VARYING,
    IDENTIFIER                         INTEGER not null,
    SHARED_HABIT_IT                    BIGINT,
    STATUS                             TINYINT,
    SUBJECT                            CHARACTER VARYING,
    TIMESTAMP                          TIMESTAMP,
    RECEIVER_ACCOUNT_AUTHENTICATION_ID CHARACTER VARYING(255),
    SENDER_ACCOUNT_AUTHENTICATION_ID   CHARACTER VARYING(255),
    constraint FKQ8XA4N44TTEFVXIKVUQPOSI2I
        foreign key (SENDER_ACCOUNT_AUTHENTICATION_ID) references PUBLIC.ACCOUNT,
    constraint FKSOUKLKEU1RP3HOHIDS0FEWFEQ
        foreign key (RECEIVER_ACCOUNT_AUTHENTICATION_ID) references PUBLIC.ACCOUNT,
    check ("STATUS" BETWEEN 0 AND 3)
);

create table PUBLIC.NOTIFICATION_TEMPLATE
(
    ID                               BIGINT auto_increment
        primary key,
    HTML_SHADE_MINIMAL_TEMPLATE_NAME CHARACTER VARYING(255),
    HTML_SHADE_TEMPLATE_NAME         CHARACTER VARYING(255),
    HTML_TEMPLATE_NAME               CHARACTER VARYING(255),
    NOTIFICATION_TYPE                TINYINT,
    SUBJECT_TEMPLATE                 CHARACTER VARYING,
    check ("NOTIFICATION_TYPE" BETWEEN 0 AND 6)
);

create table PUBLIC.SHARED_HABITS
(
    ID                         BIGINT auto_increment
        primary key,
    ALLOW_EDITING_OF_ALL_USERS BOOLEAN,
    CREATE_TIME                BIGINT,
    DESCRIPTION                CHARACTER VARYING,
    MAIN_NOTIFICATION_RULE_ID  BIGINT,
    SHARE_CODE                 CHARACTER VARYING(255)
        constraint UKPBOFITC9O2WMBHWOTIQDPEFMY
            unique,
    TITLE                      CHARACTER VARYING(255),
    OWNER_AUTHENTICATION_ID    CHARACTER VARYING(255),
    constraint FKK5WWEBBJYIUARHCTS3JU5CAOI
        foreign key (OWNER_AUTHENTICATION_ID) references PUBLIC.ACCOUNT
);

create table PUBLIC.NOTIFICATION_RULE
(
    ID                                             BIGINT auto_increment
        primary key,
    DAYS_OF_NO_NEW_RECORD_FOR_NOTIFICATION_TRIGGER INTEGER,
    ENABLED                                        BOOLEAN not null,
    INDEX                                          INTEGER,
    LAST_TIME_NOTIFICATION_WAS_SENT                DATE,
    PERCENTAGE_OF_GOAL_FOR_NOTIFICATION_TRIGGER    INTEGER,
    RULE_NAME                                      CHARACTER VARYING(255),
    INTERNAL_HABIT_FOR_COMPUTATION_OF_GOAL_UUID    CHARACTER VARYING(255),
    NOTIFICATION_TEMPLATE_ID                       BIGINT,
    SHARED_HABIT_ID                                BIGINT,
    constraint FK5EBRO1RFVM8YKOUMELWLXQCEI
        foreign key (SHARED_HABIT_ID) references PUBLIC.SHARED_HABITS,
    constraint FKNPKPMM92VHG34SREG2LISR0D3
        foreign key (INTERNAL_HABIT_FOR_COMPUTATION_OF_GOAL_UUID) references PUBLIC.HABITS,
    constraint FKSDWTJNSN5ORIUXWHX0FVF7MVF
        foreign key (NOTIFICATION_TEMPLATE_ID) references PUBLIC.NOTIFICATION_TEMPLATE
);

create table PUBLIC.CHALLENGE
(
    ID                        BIGINT not null
        primary key,
    COMPUTATION_TYPE          TINYINT,
    DESCRIPTION               CHARACTER VARYING,
    END_DATE                  DATE,
    START_DATE                DATE,
    STATUS                    TINYINT,
    TITLE                     CHARACTER VARYING(255),
    CREATOR_AUTHENTICATION_ID CHARACTER VARYING(255),
    RULE_ID                   BIGINT,
    constraint FK4NTQFS0BOAA7MRCFXB5YGBS7F
        foreign key (CREATOR_AUTHENTICATION_ID) references PUBLIC.ACCOUNT,
    constraint FK92VDUB67NTOXGG6OBDSOS0EJP
        foreign key (RULE_ID) references PUBLIC.NOTIFICATION_RULE,
    check ("COMPUTATION_TYPE" BETWEEN 0 AND 2),
    check ("STATUS" BETWEEN 0 AND 4)
);

create table PUBLIC.CHALLENGE_RESULT
(
    NUMBER_OF_DAYS_REACHED INTEGER,
    PERCENTAGE_REACHED     DOUBLE PRECISION,
    PLACEMENT              INTEGER,
    ACCOUNT_ID             CHARACTER VARYING(255) not null,
    CHALLENGE_ID           BIGINT                 not null,
    constraint FK5E9AWNLJK9AS3NV15PYTTEC6C
        foreign key (CHALLENGE_ID) references PUBLIC.CHALLENGE,
    constraint FK79H19CSAB2QTV6RBXF1LCPXV1
        foreign key (ACCOUNT_ID) references PUBLIC.ACCOUNT
);

create table PUBLIC.CHALLENGE_WINNERS
(
    CHALLENGE_ID              BIGINT                 not null,
    WINNERS_AUTHENTICATION_ID CHARACTER VARYING(255) not null,
    constraint FKDDLOT39S4H68EJPCT0RVPWJXL
        foreign key (CHALLENGE_ID) references PUBLIC.CHALLENGE,
    constraint FKFQR1I7UA1C2BGRPQOYATRUD04
        foreign key (WINNERS_AUTHENTICATION_ID) references PUBLIC.ACCOUNT
);

create table PUBLIC.SHARED_HABIT_MAPPINGS
(
    SHARED_HABIT_ID BIGINT                 not null,
    HABIT_ID        CHARACTER VARYING(255) not null,
    constraint FK9N09JY014J0M9FON1L09C1S7H
        foreign key (SHARED_HABIT_ID) references PUBLIC.SHARED_HABITS,
    constraint FKHFMTDMB2DD8UI5LAXB2MNXDMP
        foreign key (HABIT_ID) references PUBLIC.HABITS
);

create table PUBLIC.SHARED_HABIT_RESULT
(
    DATE            DATE                   not null,
    SHARED_HABIT_ID BIGINT                 not null,
    PERCENTAGE      DOUBLE PRECISION,
    PLACEMENT       INTEGER,
    ACCOUNT_ID      CHARACTER VARYING(255) not null,
    primary key (ACCOUNT_ID, DATE, SHARED_HABIT_ID),
    constraint FKHQ3RLFT7GSM9EJRVMF8M0AQOD
        foreign key (SHARED_HABIT_ID) references PUBLIC.SHARED_HABITS,
    constraint FKM1V39B6PLR3TEGP53TGGKKB5P
        foreign key (ACCOUNT_ID) references PUBLIC.ACCOUNT
);

create table PUBLIC.SPRING_SESSION
(
    PRIMARY_ID            CHARACTER(36) not null,
    SESSION_ID            CHARACTER(36) not null,
    CREATION_TIME         BIGINT        not null,
    LAST_ACCESS_TIME      BIGINT        not null,
    MAX_INACTIVE_INTERVAL INTEGER       not null,
    EXPIRY_TIME           BIGINT        not null,
    PRINCIPAL_NAME        CHARACTER VARYING(100),
    constraint SPRING_SESSION_PK
        primary key (PRIMARY_ID)
);

create unique index PUBLIC.SPRING_SESSION_IX1
    on PUBLIC.SPRING_SESSION (SESSION_ID);

create index PUBLIC.SPRING_SESSION_IX2
    on PUBLIC.SPRING_SESSION (EXPIRY_TIME);

create index PUBLIC.SPRING_SESSION_IX3
    on PUBLIC.SPRING_SESSION (PRINCIPAL_NAME);

create table PUBLIC.SPRING_SESSION_ATTRIBUTES
(
    SESSION_PRIMARY_ID CHARACTER(36)          not null,
    ATTRIBUTE_NAME     CHARACTER VARYING(200) not null,
    ATTRIBUTE_BYTES    BINARY VARYING         not null,
    constraint SPRING_SESSION_ATTRIBUTES_PK
        primary key (SESSION_PRIMARY_ID, ATTRIBUTE_NAME),
    constraint SPRING_SESSION_ATTRIBUTES_FK
        foreign key (SESSION_PRIMARY_ID) references PUBLIC.SPRING_SESSION
            on delete cascade
);

create table PUBLIC.VOTE
(
    ID                        BIGINT  not null
        primary key,
    VOTE_VALUE                INTEGER not null,
    ACCOUNT_AUTHENTICATION_ID CHARACTER VARYING(255),
    CHALLENGE_ID              BIGINT,
    constraint FKQKVNMYLLH0R3LCVR4TQ3P3PI0
        foreign key (CHALLENGE_ID) references PUBLIC.CHALLENGE,
    constraint FKQYD2D60U9SR2CVK7V17DTTPE0
        foreign key (ACCOUNT_AUTHENTICATION_ID) references PUBLIC.ACCOUNT
);

create table PUBLIC.WEBDAV_CONNECTION
(
    ID                        BIGINT auto_increment
        primary key,
    PASSWORD                  CHARACTER VARYING(255),
    STATUS                    TINYINT,
    SUBPATH                   CHARACTER VARYING(255),
    USERNAME                  CHARACTER VARYING(255),
    ACCOUNT_AUTHENTICATION_ID CHARACTER VARYING(255),
    constraint FKH2YO96AED7GNPV87VX6DBFCMC
        foreign key (ACCOUNT_AUTHENTICATION_ID) references PUBLIC.ACCOUNT,
    check ("STATUS" BETWEEN 0 AND 6)
);

create table PUBLIC.ACCOUNT_WEBDAV_CONNECTIONS
(
    ACCOUNT_AUTHENTICATION_ID CHARACTER VARYING(255) not null,
    WEBDAV_CONNECTIONS_ID     BIGINT                 not null
        constraint UKFFQR2AI45XUN9AYC4BF2O8A6D
            unique,
    constraint FK6DF9LHMDCFOO48XX9CO7CC4UM
        foreign key (WEBDAV_CONNECTIONS_ID) references PUBLIC.WEBDAV_CONNECTION,
    constraint FKDVN54G9S4I8K6N8BMEBQOLHIA
        foreign key (ACCOUNT_AUTHENTICATION_ID) references PUBLIC.ACCOUNT
);

