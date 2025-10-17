package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.imports.loophabit.LoopHabitsImportService;
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
public class ImportController {

    private final LoopHabitsImportService loopHabitsImportService;
    private final AccountService accountService;

    @PostMapping("/loop-habit")
    public ResponseEntity<String> importFromLoopHabits(@RequestParam("file") MultipartFile file) {
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
