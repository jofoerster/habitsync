package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.ServerInfoReadDTO;
import de.jofoerster.habitsync.service.information.ServerInfoService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/info")
@RequiredArgsConstructor
@Tag(name = "Server Info", description = "Public server information endpoints - no authentication required")
public class ServerInfoController {

    private final ServerInfoService serverInfoService;

    @Operation(
            summary = "Get server information",
            description = "Returns public server information including version and configuration. This endpoint is public and does not require authentication."
    )
    @ApiResponse(responseCode = "200", description = "Successfully retrieved server information")
    @GetMapping
    public ResponseEntity<ServerInfoReadDTO> getServerInfo() {
        return ResponseEntity.ok(serverInfoService.getServerInfoDTO());
    }
}
