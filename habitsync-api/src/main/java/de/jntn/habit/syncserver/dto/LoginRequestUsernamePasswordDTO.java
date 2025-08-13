package de.jntn.habit.syncserver.dto;

import lombok.Data;

@Data
public class LoginRequestUsernamePasswordDTO {
    private String username;
    private String password;
    private String redirectPath;
}
