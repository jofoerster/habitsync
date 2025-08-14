package de.jofoerster.habitsync.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@AllArgsConstructor
@Builder
public class UserMedalsReadDTO {
    AccountReadDTO account;
    List<MedalReadDTO> medals;
}
