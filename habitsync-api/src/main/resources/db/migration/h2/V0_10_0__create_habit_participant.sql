CREATE SEQUENCE habit_participant_seq START WITH 1 INCREMENT BY 50;

CREATE TABLE habit_participant
(
    id                            BIGINT NOT NULL,
    habit_uuid                    VARCHAR(255),
    participant_authentication_id VARCHAR(255),
    habit_participation_status    SMALLINT,
    CONSTRAINT pk_habitparticipant PRIMARY KEY (id)
);