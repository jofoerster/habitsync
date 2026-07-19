package de.jofoerster.habitsync.service.wasm;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.jofoerster.habitsync.service.wasm.events.CloudEvent;
import groovy.util.logging.Slf4j;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import java.io.File;
import java.io.IOException;
import java.util.concurrent.TimeUnit;

@lombok.extern.slf4j.Slf4j
@Service
@RequiredArgsConstructor
@Slf4j
public class WasmRunnerService {

    @Value("${wasm.component.timeout.seconds}")
    private int wasmComponentTimeoutSeconds;

    private final ObjectMapper objectMapper;

    @Async
    public void executeWasmPlugin(File wasmFile, CloudEvent event) {

        try {
            objectMapper.writeValueAsString(event);
        } catch (IOException e) {
            log.error("Failed to serialize CloudEvent: {}", e.getMessage());
            return;
        }

        ProcessBuilder processBuilder = new ProcessBuilder(
                "wasmtime", "run",
                "-S", "http",
                "--env", "EVENT=" + event,
                wasmFile.getAbsolutePath()
        );

        try {
            Process process = processBuilder.start();

            boolean finished = process.waitFor(wasmComponentTimeoutSeconds, TimeUnit.SECONDS);

            if (!finished) {
                process.destroyForcibly();
                System.err.println("WASM Plugin execution timed out and was killed.");
                return;
            }

        } catch (IOException | InterruptedException e) {
            System.err.println("Failed to execute WASM process: " + e.getMessage());
            Thread.currentThread().interrupt();
        }
    }
}