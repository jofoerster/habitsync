package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.imports.loophabit.LoopHabitsImportService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.security.SecurityRequirements;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@Controller
@RequestMapping("/api/import")
@RequiredArgsConstructor
@Tag(name = "Import", description = "Data import endpoints - authentication required")
@SecurityRequirements({
        @SecurityRequirement(name = "bearerAuth"),
        @SecurityRequirement(name = "apiKey"),
        @SecurityRequirement(name = "basicAuth")
})
public class ImportController {

    private final LoopHabitsImportService loopHabitsImportService;
    private final AccountService accountService;

    @Operation(
            summary = "Import from Loop Habits",
            description = "Imports habits and records from a Loop Habits .db backup file."
    )
    @ApiResponses(value = {
            @ApiResponse(responseCode = "200", description = "Successfully imported data"),
            @ApiResponse(responseCode = "400", description = "Invalid file format - only .db files are supported"),
            @ApiResponse(responseCode = "401", description = "Unauthorized - authentication required"),
            @ApiResponse(responseCode = "500", description = "Failed to process the file")
    })
    @PostMapping("/loop-habit")
    public ResponseEntity<String> importFromLoopHabits(
            @Parameter(description = "Loop Habits .db backup file") @RequestParam("file") MultipartFile file) {
        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("Please upload a valid .db file");
        }

        String filename = file.getOriginalFilename();
        if (filename == null || !filename.toLowerCase().endsWith(".db")) {
            return ResponseEntity.badRequest().body("Only .db files are supported");
        }

        try {
            loopHabitsImportService.importFromDb(file, accountService.getCurrentAccount());
            return ResponseEntity.ok("Import successful");
        } catch (IOException e) {
            return ResponseEntity.internalServerError().body("Failed to process db file: " + e.getMessage());
        }
    }
}
