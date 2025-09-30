package de.jofoerster.habitsync.service.habit;

import com.fasterxml.jackson.databind.ObjectMapper;
import de.jofoerster.habitsync.dto.*;
import de.jofoerster.habitsync.model.account.Account;
import de.jofoerster.habitsync.model.habit.Habit;
import de.jofoerster.habitsync.model.habit.HabitType;
import de.jofoerster.habitsync.model.notification.NotificationRule;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabit;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabitHabitPair;
import de.jofoerster.habitsync.model.sharedHabit.SharedHabitResult;
import de.jofoerster.habitsync.repository.habit.*;
import de.jofoerster.habitsync.service.account.AccountService;
import de.jofoerster.habitsync.service.notification.NotificationRuleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@RequiredArgsConstructor
@Slf4j
@Service
public class HabitService {

    private final HabitRepository habitRepository;
    private final SharedHabitRepository sharedHabitRepository;
    private final HabitRecordRepository habitRecordRepository;
    private final Random rand = new Random();
    private final SharedHabitResultsRepository sharedHabitResultsRepository;

    ObjectMapper mapper = new ObjectMapper();

    public List<Habit> getAllUserHabitsByType(Account account, HabitType habitType) {
        return habitRepository.findByAccountAndHabitTypeAndStatusOrderBySortPosition(account, habitType, 1);
    }

    public Optional<Habit> getHabitByUuid(String uuid) {
        return habitRepository.findByUuid(uuid);
    }

    public Habit saveHabit(Habit habit) {
        return habitRepository.save(habit);
    }

    public Optional<SharedHabit> addHabitToShared(Optional<SharedHabit> sharedHabitOpt, String habitUuid,
                                                  Account account, AccountService accountService,
                                                  NotificationRuleService notificationRuleService,
                                                  SharedHabitService sharedHabitService) {
        Optional<Habit> habitOpt = habitRepository.findByUuid(habitUuid);

        if (sharedHabitOpt.isPresent()) {
            SharedHabit sharedHabit = sharedHabitOpt.get();

            Habit habitToAdd = habitOpt.orElse(new Habit());

            if (habitOpt.isEmpty()) {
                Habit usedHabit = sharedHabit.getMainNotificationRule(notificationRuleService)
                        .map(NotificationRule::getInternalHabitForComputationOfGoal)
                        .orElse(sharedHabit.getHabitByOwner(sharedHabit.getOwner())
                                .orElse(new Habit()));
                habitToAdd.setName(sharedHabit.getTitle());
                habitToAdd.setAccount(accountService.getCurrentAccount());
                habitToAdd.setFreqCustom(usedHabit.getFreqCustom());
                habitToAdd.setFreqType(usedHabit.getFreqType());
                habitToAdd.setHabitType(HabitType.INTERNAL);
                habitToAdd.setDailyGoal(usedHabit.getDailyGoal());
                habitToAdd.setDailyGoalUnit(usedHabit.getDailyGoalUnit());
                habitToAdd.setTargetDays(usedHabit.getTargetDays());
                habitToAdd.setSortPosition(999d);
                habitToAdd.setType(usedHabit.getType());
                habitToAdd.setStatus(1);
                habitToAdd.setStartDate((int) LocalDate.now()
                        .toEpochDay());
                habitToAdd.setColor(rand.nextInt(10) + 1);
                habitToAdd.setConnectedSharedHabitId(sharedHabit.getId());
                habitRepository.save(habitToAdd);
            }
            sharedHabit.addHabit(habitToAdd);
            return Optional.of(sharedHabitService.save(sharedHabit));
        }

        return Optional.empty();
    }

    public void removeHabitFromShared(String shareCode, Account currentAccount,
                                      SharedHabitService sharedHabitService) {
        Optional<SharedHabit> sharedHabitOpt = sharedHabitRepository.findByShareCode(shareCode);

        if (sharedHabitOpt.isPresent()) {
            SharedHabit sharedHabit = sharedHabitOpt.get();
            if (sharedHabit.getOwner().equals(currentAccount)) {
                sharedHabit.setAllowEditingOfAllUsers(true);
            }
            List<Habit> habits = sharedHabit.getHabits()
                    .stream()
                    .filter(h -> h.getAccount().equals(currentAccount))
                    .toList();
            habits.forEach(h -> {
                sharedHabit.removeHabit(h);
                sharedHabitService.save(sharedHabit);
                h.setConnectedSharedHabitId(null);
                this.saveHabit(h);
            });
        }
    }

    public List<Habit> getChallengeHabits(Account account) {
        List<Habit> habits = habitRepository.findHabitsByAccountAndChallengeHabit(account, true);
        if (habits.size() > 1) {
            log.error("Found more than one challenge habit for user {}. Challenge habits: {}", account, habits);
        }
        return habits;
    }

    public List<Habit> getChallengeHabits() {
        return habitRepository.findHabitsByChallengeHabitIsTrue();
    }

    public Habit deleteHabit(Habit habit) {
        habit.setStatus(2);
        return habitRepository.save(habit);
    }

    public List<SharedHabitHabitPair> getAllRelatedHabitsToHabitOfUser(Account account, String habitUuid,
                                                                       HabitType habitType) {
        Optional<Habit> habit = habitRepository.findByUuid(habitUuid);
        if (habit.isEmpty()) {
            return new ArrayList<>();
        }
        List<SharedHabit> sharedHabits = sharedHabitRepository.findAllByHabitsContaining(List.of(habit.get()));
        List<SharedHabitHabitPair> result = new ArrayList<>();
        sharedHabits.forEach(sh -> sh.getHabits()
                .forEach(h -> {
                    if (!h.getAccount()
                            .equals(account)) {
                        result.add(new SharedHabitHabitPair(sh, h));
                    }
                }));
        return result;
    }

    public Long getNumberOfConnectedHabits(String habitUuid, HabitType habitType) {
        Optional<Habit> habit = habitRepository.findByUuid(habitUuid);
        if (habit.isEmpty()) {
            return 0L;
        }
        List<SharedHabit> sharedHabits = sharedHabitRepository.findAllByHabitsContaining(List.of(habit.get()));
        long result = 0L;
        for (SharedHabit sh : sharedHabits) {
            result += sh.getHabits().size() - 1; // -1 because the habit itself is included in the shared habits
        }
        return result;
    }

    public List<HabitReadDTO> getAllUserHabits(Account currentAccount) {
        return this.getAllUserHabitsByType(currentAccount, HabitType.INTERNAL).stream()
                .filter(h -> !h.isChallengeHabit())
                .map(this::getApiHabitReadFromHabit).toList();
    }

    public HabitReadDTO getApiHabitReadFromHabit(Habit habit) {
        Double currentPercentage = habit.getCompletionPercentage(new HabitRecordSupplier(habitRecordRepository));
        String currentMedal = getLastMonthMedalString(habit);
        return HabitReadDTO.builder()
                .color(habit.getColor())
                .uuid(habit.getUuid())
                .name(habit.getName())
                .account(habit.getAccount().getApiAccountRead())
                .progressComputation(habit.getApiComputationReadWrite())
                .currentPercentage(currentPercentage)
                .currentMedal(currentMedal)
                .sortPosition(habit.getSortPosition())
                .isChallengeHabit(habit.isChallengeHabit())
                .synchronizedSharedHabitId(habit.getConnectedSharedHabitId())
                .notificationFrequency(this.getNotificationConfig(habit))
                .build();

    }

    public HabitReadDTO createNewHabit(HabitWriteDTO apiHabitWrite, Account currentAccount) {
        Habit habit = new Habit();
        habit.setAccount(currentAccount);
        habit.setHabitType(HabitType.INTERNAL);
        habit.applyChanges(apiHabitWrite);
        this.saveHabit(habit);
        return getApiHabitReadFromHabit(habit);
    }

    public HabitReadDTO updateHabit(String uuid, HabitWriteDTO apiHabitWrite) {
        Optional<Habit> habitOpt = getHabitByUuid(uuid);
        if (habitOpt.isEmpty()) {
            throw new EntityNotFoundException("Habit with UUID " + uuid + " not found.");
        }
        Habit habit = habitOpt.get();
        habit.applyChanges(apiHabitWrite);
        saveHabit(habit);
        return getApiHabitReadFromHabit(habit);
    }

    public Habit createChallengeHabitForAccount(Account account) {
        Habit habit = new Habit();
        habit.setAccount(account);
        habit.setName("Challenge Habit");
        habit.setChallengeHabit(true);
        habit.setStartDate((int) LocalDate.now()
                .toEpochDay());
        habit.setStatus(1);
        habit.setHabitType(HabitType.INTERNAL);
        habit.setDailyGoal(1d);
        habit.setDailyGoalExtra(1d);
        habit.setFreqCustom("[1,1]");
        habit = this.saveHabit(habit);
        return habit;
    }

    public void moveHabit(Account account, Habit habit, boolean moveUp) {
        List<Habit> habits = getAllUserHabitsByType(account, HabitType.INTERNAL);
        int oldPosition = habits.indexOf(habit);
        int newPosition = moveUp ? oldPosition - 1 : oldPosition + 1;
        if (newPosition < 0 || newPosition >= habits.size() || oldPosition < 0) {
            throw new IllegalArgumentException("Position out of bounds: " + newPosition);
        }
        Collections.swap(habits, newPosition, oldPosition);

        List<Habit> habitsToUpdate = new ArrayList<>();
        int index = 0;
        for (Habit h : habits) {
            if (h.getSortPosition() != index) {
                h.setSortPosition((double) index);
                habitsToUpdate.add(h);
            }
            index++;
        }
        habitRepository.saveAll(habitsToUpdate);
    }

    public List<Habit> getHabitsWithReminders() {
        return habitRepository.findByReminderCustomIsNotEmptyAndStatus(1);
    }

    public NotificationConfigDTO getNotificationConfig(Habit habit) {
        String frequency = habit.getReminderCustom();
        if (frequency == null || frequency.isEmpty()) {
            return null;
        }
        try {
            return mapper.readValue(frequency, NotificationConfigDTO.class);
        } catch (Exception e){
            log.warn("Could not parse notification frequency: {}", frequency, e);
            return null;
        }
    }

    public List<NotificationConfigRuleDTO> getFixedTimeNotificationRules (Habit habit) {
        String reminderCustom = habit.getReminderCustom();
        if (reminderCustom == null || reminderCustom.isEmpty()) {
            return new ArrayList<>();
        }
        try {
            NotificationConfigDTO configDTO = mapper.readValue(reminderCustom, NotificationConfigDTO.class);
            return configDTO.getRules().stream().filter(r -> r.getType() == NotificationTypeEnum.fixed).toList();
        } catch (Exception e){
            try {
                DeprecatedNotificationFrequencyDTO configDTO =
                        mapper.readValue(reminderCustom, DeprecatedNotificationFrequencyDTO.class);
                return List.of(NotificationConfigRuleDTO.builder()
                        .type(NotificationTypeEnum.fixed)
                        .enabled(true)
                        .triggerIfFulfilled(false)
                        .weekdays(configDTO.weekdays)
                        .frequency(configDTO.frequency)
                        .time(configDTO.time)
                        .build());
            } catch (Exception ex) {
                log.warn("Could not parse notification reminderCustom: {}", reminderCustom, e);
                return new ArrayList<>();
            }
        }
    }

    private String getLastMonthMedalString(Habit h) {
        List<SharedHabit> sharedHabits = sharedHabitRepository.findAllByHabitsContaining(List.of(h));
        SharedHabit sharedHabit;
        if (sharedHabits.isEmpty()) {
            return "";
        }

        sharedHabit = sharedHabits.getFirst();

        List<SharedHabitResult> results = sharedHabitResultsRepository
                .getSharedHabitResultBySharedHabitAndAccount(sharedHabit, h.getAccount());
        List<SharedHabitResult> resultsFiltered = results.stream().filter(r -> r.getId().getDate()
                .equals(LocalDate.now().minusMonths(1).withDayOfMonth(1))).toList();
        if (!resultsFiltered.isEmpty()) {
            switch (resultsFiltered.getFirst().getPlacement()) {
                case 1:
                    return "\uD83E\uDD47";
                case 2:
                    return "\uD83E\uDD48";
                case 3:
                    return "\uD83E\uDD49";
            }
        }
        return "";
    }

    public boolean hasHabitBeenCompletedToday(Habit habit, HabitRecordSupplier habitRecordSupplier) {
        return habitRecordSupplier.getHabitRecordsInRange(habit, LocalDate.now(), LocalDate.now())
                .stream()
                .anyMatch(r -> r.getRecordValue() != null && r.getRecordValue() != 0);
    }

    private class DeprecatedNotificationFrequencyDTO {
        private FrequencyEnum frequency;
        private String[] weekdays; // MO, TU, WE, TH, FR, SA, SU
        private String time;
        private String appriseTarget; // optional, only for custom target
    }
}
