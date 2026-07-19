package de.jofoerster.habitsync.repository.plugin;

import de.jofoerster.habitsync.model.plugin.Plugin;
import org.springframework.data.jpa.repository.JpaRepository;

public interface PluginRepository extends JpaRepository<Plugin, Long> {
}
