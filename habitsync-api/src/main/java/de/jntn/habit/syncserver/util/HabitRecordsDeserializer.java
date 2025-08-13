package de.jntn.habit.syncserver.util;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonNode;
import de.jntn.habit.syncserver.model.habit.HabitRecord;

import java.io.IOException;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Custom deserializer for handling the special records format from the JSON input
 */
public class HabitRecordsDeserializer extends JsonDeserializer<List<HabitRecord>> {
    @Override
    public List<HabitRecord> deserialize(JsonParser jsonParser, DeserializationContext context) throws IOException {

        JsonNode arrayNode = jsonParser.getCodec()
                .readTree(jsonParser);
        if (!arrayNode.isArray() || arrayNode.size() < 2) {
            return new ArrayList<>();
        }

        // The first element contains header names
        JsonNode headersNode = arrayNode.get(0);
        String[] headers = new String[headersNode.size()];
        for (int i = 0; i < headersNode.size(); i++) {
            headers[i] = headersNode.get(i)
                    .asText();
        }

        List<HabitRecord> records = new ArrayList<>();

        // Process each data row (starting from index 1)
        for (int i = 1; i < arrayNode.size(); i++) {
            JsonNode rowNode = arrayNode.get(i);
            if (!rowNode.isArray()) continue;

            Map<String, Object> values = new HashMap<>();
            for (int j = 0; j < Math.min(headers.length, rowNode.size()); j++) {
                JsonNode valueNode = rowNode.get(j);
                if (valueNode.isNull()) {
                    values.put(headers[j], null);
                } else if (valueNode.isNumber()) {
                    values.put(headers[j], valueNode.asDouble());
                } else {
                    values.put(headers[j], valueNode.asText());
                }
            }

            // Create and populate the HabitRecord
            HabitRecord record = new HabitRecord();

            // Set values from the map based on column names
            if (values.containsKey("record_date")) {
                record.setRecordDate(((Number) values.get("record_date")).intValue());
            }
            if (values.containsKey("record_type")) {
                record.setRecordType(((Number) values.get("record_type")).intValue());
            }
            if (values.containsKey("record_value")) {
                record.setRecordValue(((Number) values.get("record_value")).doubleValue());
            }
            if (values.containsKey("create_t")) {
                record.setCreateT(((Number) values.get("create_t")).longValue());
            }
            if (values.containsKey("modify_t")) {
                record.setModifyT(((Number) values.get("modify_t")).longValue());
            }
            if (values.containsKey("uuid")) {
                record.setUuid((String) values.get("uuid"));
            }
            if (values.containsKey("parent_uuid")) {
                record.setParentUuid((String) values.get("parent_uuid"));
            }
            if (values.containsKey("reason")) {
                record.setReason((String) values.get("reason"));
            }
            if (values.containsKey("sessionId")) {
                record.setSessionId((String) values.get("sessionId"));
            }

            records.add(record);
        }

        return records;
    }
}
