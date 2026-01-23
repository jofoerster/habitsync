package de.jofoerster.habitsync.controller;

import de.jofoerster.habitsync.dto.ServerInfoReadDTO;
import de.jofoerster.habitsync.service.information.ServerInfoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/info")
@RequiredArgsConstructor
public class ServerInfoController {

    private final ServerInfoService serverInfoService;

    @GetMapping
    public ResponseEntity<ServerInfoReadDTO> getServerInfo() {
        return ResponseEntity.ok(serverInfoService.getServerInfoDTO());
    }
}
