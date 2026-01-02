# Integrationg with Home Assistant

Use the following example configurations in your main `configuration.yaml` and restart Home Assistant.
Replace `<your-api-host>` and `<your-habit-uuid>` with your actual API host and habit UUID (copy from the url when in
habit details page).
To authenticate, you can create an API key on the profile page. Best practice is to save it in `secrets.yaml`.

```yaml
# configuration.yaml

rest_command:
  # 1. Create a record with default value 1 for a specific habit.
  create_habit_record_simple:
    url: "http://<your-api-host>/api/record/<your-habit-uuid>/simple?value=1.0"
    method: "POST"
    headers:
      X-Api-Key: "<your-api-key-or-reference-to-secrets>"

  # 2. A reusable command that can create a record for any habit
  #    with a dynamic value, offset, and timezone. The variables (e.g., {{ habit_uuid }})
  #    must be provided when you call this service.
  create_habit_record_complex:
    url: "http://<your-api-host>/api/record/{{ habit_uuid }}/simple?value={{ value }}&offset={{ offset }}&timeZone={{ time_zone }}"
    method: "POST"
    headers:
      X-Api-Key: "<your-api-key-or-reference-to-secrets>"

template:
  - button:
      # 1. Pressing this in the UI will call the 'create_habit_record_simple' command.
      - name: "Log Simple Habit (Default Value)"
        unique_id: log_simple_habit_default_value_button
        press:
          - service: rest_command.create_habit_record_simple

      # 2. This button calls the complex rest_command with a set of
      #    pre-defined parameters. These could also be dynamic.
      - name: "Log Yesterday's Habit (Complex Example)"
        unique_id: log_yesterdays_habit_complex_example_button
        press:
          - service: rest_command.create_habit_record_complex
            data:
              habit_uuid: "<your-habit-uuid>"
              value: 5.5
              offset: -1
              time_zone: "Europe/Berlin"

sensor:
  - platform: rest
    # 1. Gets the record for the current day (API defaults offset to 0 and uses server timezone).
    name: "Habit Today's Value"
    unique_id: habit_today_value_sensor
    resource: "http://<your-api-host>/api/record/<your-habit-uuid>/simple"
    headers:
      X-Api-Key: "<your-api-key-or-reference-to-secrets>"
    value_template: "{{ value_json.recordValue }}"
    json_attributes:
      - "uuid"
      - "habitUuid"
      - "epochDay"
      - "completion"
    scan_interval: 60 # Poll every 1 minute

  - platform: rest
    # 2. Gets the record for yesterday using a specific timezone.
    name: "Habit Yesterday's Value"
    unique_id: habit_yesterday_value_sensor_complex
    resource: "http://<your-api-host>/api/record/<your-habit-uuid>/simple?offset=-1&timeZone=Europe/Berlin"
    headers:
      X-Api-Key: "<your-api-key-or-reference-to-secrets>"
    value_template: "{{ value_json.recordValue }}"
    json_attributes:
      - "uuid"
      - "habitUuid"
      - "epochDay"
      - "completion"
    scan_interval: 60
```
