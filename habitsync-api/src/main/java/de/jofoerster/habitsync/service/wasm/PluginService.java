package de.jofoerster.habitsync.service.wasm;

import de.jofoerster.habitsync.dto.PluginResponseDTO;
import de.jofoerster.habitsync.model.plugin.Plugin;
import de.jofoerster.habitsync.repository.plugin.PluginRepository;
import de.jofoerster.habitsync.service.wasm.events.EventType;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

@Service
public class PluginService {

    private final Path storageLocation = Paths.get("/data/plugins");
    private final PluginRepository pluginRepository;

    public PluginService(PluginRepository pluginRepository) {
        this.pluginRepository = pluginRepository;
        try {
            Files.createDirectories(storageLocation);
        } catch (IOException e) {
            throw new RuntimeException("Could not initialize plugin storage directory", e);
        }
    }

    public PluginResponseDTO installPlugin(EventType eventType, String subjectUuid, MultipartFile file) {
        UUID pluginId = UUID.randomUUID();

        String safeFilename = pluginId + ".wasm";
        Path targetLocation = this.storageLocation.resolve(safeFilename);

        try {
            Files.copy(file.getInputStream(), targetLocation, StandardCopyOption.REPLACE_EXISTING);

            Plugin entity = new Plugin(pluginId, eventType, subjectUuid, safeFilename, true);
            pluginRepository.save(entity);

            return new PluginResponseDTO(
                    pluginId,
                    eventType,
                    subjectUuid,
                    safeFilename,
                    true
            );

        } catch (IOException ex) {
            throw new RuntimeException("Could not store file " + file.getOriginalFilename(), ex);
        }
    }

    public List<PluginResponseDTO> getAllPlugins() {
        return null; //TODO
    }

    public void deletePlugin(UUID id) {
        return; //TODO
    }

    public PluginResponseDTO updateStatus(UUID id, boolean isActive) {
        return null; //TODO
    }

    // TODO Implement getAll, delete, and toggle status methods
}