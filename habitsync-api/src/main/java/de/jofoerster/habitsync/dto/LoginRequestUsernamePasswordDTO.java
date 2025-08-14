package de.jofoerster.habitsync.dto;

import lombok.Data;

@Data
public class LoginRequestUsernamePasswordDTO {
    private String username;
    private String password;
    private String redirectPath;
}
