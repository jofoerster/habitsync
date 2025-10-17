package de.jofoerster.habitsync.service.imports;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.sql.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class SqliteImportService {

    private static final Logger logger = LoggerFactory.getLogger(SqliteImportService.class);

    public List importSqliteData(MultipartFile file, String sqlQuery) throws IOException, SQLException {
        Path tempDir = Files.createTempDirectory("sqlite-import-");
        Path tempFile = tempDir.resolve(file.getOriginalFilename());
        file.transferTo(tempFile);

        logger.info("Uploaded file saved temporarily to: {}", tempFile.toAbsolutePath());

        List processedData = new ArrayList<>();
        String jdbcUrl = "jdbc:sqlite:" + tempFile.toAbsolutePath();

        try {
            try (Connection conn = DriverManager.getConnection(jdbcUrl);
                 Statement stmt = conn.createStatement()) {

                logger.info("Successfully connected to the SQLite database.");

                try (ResultSet rs = stmt.executeQuery(sqlQuery)) {
                    ResultSetMetaData metaData = rs.getMetaData();
                    int columnCount = metaData.getColumnCount();
                    while (rs.next()) {
                        Map<String, Object> row = new HashMap<>();
                        for (int i = 1; i <= columnCount; i++) {
                            String columnName = metaData.getColumnName(i);
                            Object value = rs.getObject(i);
                            row.put(columnName, value);
                        }
                        processedData.add(row);
                    }
                }
            }
        } catch (SQLException e) {
            logger.error("Database error while processing SQLite file", e);
            throw e;
        } finally {
            try {
                Files.delete(tempFile);
                Files.delete(tempDir);
                logger.info("Temporary files have been deleted.");
            } catch (IOException e) {
                logger.error("Could not delete temporary files.", e);
            }
        }

        return processedData;
    }
}
