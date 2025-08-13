package de.jntn.habit.syncserver.service.habit;

import de.jntn.habit.syncserver.dto.*;
import de.jntn.habit.syncserver.model.account.Account;
import de.jntn.habit.syncserver.model.habit.Habit;
import de.jntn.habit.syncserver.model.notification.NotificationRule;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabit;
import de.jntn.habit.syncserver.model.sharedHabit.SharedHabitResult;
import de.jntn.habit.syncserver.repository.habit.*;
import de.jntn.habit.syncserver.service.notification.NotificationRuleService;
import jakarta.transaction.Transactional;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.util.*;

@Service
public class SharedHabitService {
    private final SharedHabitRepository sharedHabitRepository;
    private final HabitRecordSupplier habitRecordSupplier;
    private final NotificationRuleService notificationRuleService;
    private final SharedHabitResultsRepository sharedHabitResultsRepository;
    private final HabitRepository habitRepository;

    public SharedHabitService(SharedHabitRepository sharedHabitRepository, HabitRecordRepository habitRecordRepository,
                              NotificationRuleService notificationRuleService,
                              SharedHabitResultsRepository sharedHabitResultsRepository,
                              HabitRepository habitRepository) {
        this.sharedHabitRepository = sharedHabitRepository;
        this.habitRecordSupplier = new HabitRecordSupplier(habitRecordRepository);
        this.notificationRuleService = notificationRuleService;
        this.sharedHabitResultsRepository = sharedHabitResultsRepository;
        this.habitRepository = habitRepository;
    }

    public Optional<SharedHabit> getSharedHabitByCode(String shareCode) {
        return sharedHabitRepository.findByShareCode(shareCode);
    }

    public SharedHabit save(SharedHabit sharedHabit) {
        SharedHabit sh = sharedHabitRepository.save(sharedHabit);
        if (sh.getMainNotificationRule(notificationRuleService).isPresent()) {
            Habit mainHabit = sh.getMainNotificationRule(notificationRuleService)
                    .get().getInternalHabitForComputationOfGoal();
            if (mainHabit != null) {
                mainHabit.setName(sh.getTitle());
                habitRepository.save(mainHabit);
            }
        }
        sychronizeHabitsToSharedHabit(sharedHabit);
        return sh;
    }

    public void sychronizeHabitsToSharedHabit(SharedHabit sharedHabit) {
        List<Habit> habitsToUpdate = sharedHabit.getHabits().stream()
                .filter(habit -> habit.getConnectedSharedHabitId() != null &&
                        habit.getConnectedSharedHabitId().equals(sharedHabit.getId())).toList();
        habitsToUpdate.forEach(this::synchronizeHabitToSharedHabit);
    }

    public List<SharedHabit> getSharedHabitsByHabit(Habit habit) {
        return sharedHabitRepository.findAllByHabitsContaining(List.of(habit));
    }

    @Transactional
    @Scheduled(cron = "0 0 0 1 * *")
    public void createSharedHabitResultsForMonth() {
        LocalDate date = LocalDate.now()
                .minusDays(1)
                .withDayOfMonth(1);
        List<SharedHabit> sharedHabits = sharedHabitRepository.findAllByHabitsIsNotEmpty();
        List<SharedHabitResult> sharedHabitResults = new ArrayList<>();
        for (SharedHabit sharedHabit : sharedHabits) {
            List<Map.Entry<Account, Double>> progress = sharedHabit.getHabits()
                    .stream()
                    .map(h -> Map.entry(h.getAccount(),
                            sharedHabit.getProgressOfHabit(h, notificationRuleService, habitRecordSupplier)))
                    .sorted(Map.Entry.<Account, Double>comparingByValue()
                            .reversed())
                    .toList();
            int currentPlacement = 0;
            double currentValue = Double.MAX_VALUE;

            for (Map.Entry<Account, Double> entry : progress) {
                if (entry.getValue() < currentValue) {
                    if (entry.getValue() < 50) {
                        break;
                    } // only accounts with more than 50% get a shared habit result
                    currentPlacement++;
                    currentValue = entry.getValue();
                }
                sharedHabitResults.add(
                        new SharedHabitResult(date, entry.getKey(), sharedHabit, entry.getValue(), currentPlacement));
            }
        }
        sharedHabitResultsRepository.saveAll(sharedHabitResults);
    }

    public boolean synchronizeHabitToSharedHabit(Habit habit) {
        if (habit == null || habit.getConnectedSharedHabitId() == null) {
            return false;
        }
        Optional<SharedHabit> sharedHabitOptional = sharedHabitRepository.findById(habit.getConnectedSharedHabitId());
        if (sharedHabitOptional.isEmpty()) {
            return false;
        }
        Optional<NotificationRule> notificationRuleOpt =
                sharedHabitOptional.get().getMainNotificationRule(notificationRuleService);
        if (notificationRuleOpt.isEmpty() || notificationRuleOpt.get().getInternalHabitForComputationOfGoal() == null) {
            return false;
        }
        habit.copyAttributesFromHabit(notificationRuleOpt.get().getInternalHabitForComputationOfGoal());
        habitRepository.save(habit);
        return true;
    }

    public boolean linkSharedHabitToHabit(Habit habit, Long sharedHabitId) {
        habit.setConnectedSharedHabitId(sharedHabitId);
        return this.synchronizeHabitToSharedHabit(habit);

    }

    public boolean unlinkSharedHabit(Habit habit) {
        if (habit.getConnectedSharedHabitId() == null) {
            return false;
        }
        habit.setConnectedSharedHabitId(null);
        habitRepository.save(habit);
        return true;
    }

    public SharedHabitReadDTO getApiSharedHabitReadFromSharedHabit(SharedHabit sharedHabit, HabitService habitService) {
        if (sharedHabit == null) {
            return null;
        }
        ComputationReadWriteDTO progressComputation = null;
        Optional<NotificationRule> notificationRule = sharedHabit.getMainNotificationRule(notificationRuleService);
        if (notificationRule.isPresent()) {
            if (notificationRule.get().getInternalHabitForComputationOfGoal() != null) {
                progressComputation =
                        notificationRule.get().getInternalHabitForComputationOfGoal().getApiComputationReadWrite();
            }
        }
        if (progressComputation == null) {
            Habit habit = sharedHabit.getHabitByOwner(sharedHabit.getOwner()).orElse(
                    !sharedHabit.getHabits().isEmpty() ? sharedHabit.getHabits().iterator().next() : null
            );

            if (habit != null) {
                progressComputation = habit.getApiComputationReadWrite();
            }
        }

        return SharedHabitReadDTO.builder()
                .habits(sharedHabit.getHabits().stream().map(habitService::getApiHabitReadFromHabit).toList())
                .title(sharedHabit.getTitle())
                .description(sharedHabit.getDescription())
                .shareCode(sharedHabit.getShareCode())
                .id(sharedHabit.getId())
                .owner(sharedHabit.getOwner().getApiAccountRead())
                .allowEditingOfAllUsers(sharedHabit.getAllowEditingOfAllUsers())
                .creationTime(sharedHabit.getCreateTime())
                .progressComputation(progressComputation)
                .build();
    }


    public List<SharedHabitReadDTO> getSharedHabitsByAccount(Account currentAccount, HabitService habitService) {
        return sharedHabitRepository.findAll().stream()
                .filter(sharedHabit -> sharedHabit.getHabitByOwner(currentAccount).isPresent())
                .map(sh -> this.getApiSharedHabitReadFromSharedHabit(sh, habitService))
                .toList();
    }

    public SharedHabitReadDTO createNewSharedHabit(SharedHabitWriteDTO sharedHabitWrite, Account account,
                                                   HabitService habitService) {
        SharedHabit sharedHabit = new SharedHabit();
        sharedHabit.setTitle(sharedHabitWrite.getTitle());
        sharedHabit.setDescription(sharedHabitWrite.getDescription());
        sharedHabit.setAllowEditingOfAllUsers(sharedHabitWrite.getAllowEditingOfAllUsers());
        sharedHabit.setOwner(account);
        sharedHabit.setCreateTime(System.currentTimeMillis());
        sharedHabit = save(sharedHabit);

        NotificationRule rule = new NotificationRule();
        rule.setSharedHabit(sharedHabit);

        Habit habit = new Habit();
        habit.applyChanges(sharedHabitWrite.getProgressComputation());
        habitService.saveHabit(habit);
        rule.setInternalHabitForComputationOfGoal(habit);
        rule = notificationRuleService.saveNotificationRule(rule);
        sharedHabit.setMainNotificationRuleId(rule.getId());
        sharedHabit = save(sharedHabit);

        if (sharedHabitWrite.getHabitUuid() != null) {
            Optional<Habit> habitToAdd = habitService.getHabitByUuid(sharedHabitWrite.getHabitUuid());
            if (habitToAdd.isPresent()) {
                sharedHabit.addHabit(habitToAdd.get());
                sharedHabit = save(sharedHabit);
                this.linkSharedHabitToHabit(habitToAdd.get(), sharedHabit.getId());
            }
        }

        return getApiSharedHabitReadFromSharedHabit(sharedHabit, habitService);
    }

    public SharedHabitReadDTO updateSharedHabit(String shareCode, SharedHabitWriteDTO sharedHabitWrite,
                                                Account currentAccount, HabitService habitService) {
        Optional<SharedHabit> sharedHabitOpt = getSharedHabitByCode(shareCode);
        if (sharedHabitOpt.isEmpty()) {
            throw new IllegalStateException("Shared habit not found with share code: " + shareCode);
        }
        SharedHabit sharedHabit = sharedHabitOpt.get();

        sharedHabit.setTitle(sharedHabitWrite.getTitle());
        sharedHabit.setDescription(sharedHabitWrite.getDescription());
        sharedHabit.setAllowEditingOfAllUsers(sharedHabitWrite.getAllowEditingOfAllUsers());

        Optional<NotificationRule> ruleOpt =
                notificationRuleService.getNotificationRuleById(sharedHabit.getMainNotificationRuleId());
        NotificationRule rule;
        if (ruleOpt.isEmpty()) {
            rule = new NotificationRule();
            rule.setSharedHabit(sharedHabit);
            Habit habit = new Habit();
            habit.applyChanges(sharedHabitWrite.getProgressComputation());
            habitService.saveHabit(habit);
            rule.setInternalHabitForComputationOfGoal(habit);
            notificationRuleService.saveNotificationRule(rule);
        } else {
            rule = ruleOpt.get();
        }

        Habit habit = rule.getInternalHabitForComputationOfGoal();
        habit.applyChanges(sharedHabitWrite.getProgressComputation());
        habitService.saveHabit(habit);

        sharedHabit.setMainNotificationRuleId(rule.getId());
        sharedHabit = save(sharedHabit);

        sychronizeHabitsToSharedHabit(sharedHabit);

        return getApiSharedHabitReadFromSharedHabit(sharedHabit, habitService);
    }

    public List<UserMedalsReadDTO> getMedalsForSharedHabit(String shareCode) {
        Optional<SharedHabit> sharedHabitOpt = getSharedHabitByCode(shareCode);
        if (sharedHabitOpt.isEmpty()) {
            throw new IllegalStateException("Shared habit not found with share code: " + shareCode);
        }
        SharedHabit sharedHabit = sharedHabitOpt.get();
        Map<Account, Map<Integer, Integer>> medalMap = new HashMap<>();
        for (SharedHabitResult result : sharedHabitResultsRepository.getSharedHabitResultsBySharedHabit(sharedHabit)) {
            if (result.getPlacement() < 1 || result.getPlacement() > 3) {
                continue; // Only placements 1-3 are considered for medals
            }
            Map<Integer, Integer> placementMap = medalMap.getOrDefault(result.getAccount(), new HashMap<>());
            int placement = result.getPlacement();
            int numberOfTimesPlacementReached = placementMap.getOrDefault(placement, 0);
            placementMap.put(placement, numberOfTimesPlacementReached + 1);
            medalMap.put(result.getAccount(), placementMap);
        }
        return medalMap.entrySet().stream()
                .map((entry) -> {
                    Account account = entry.getKey();
                    Map<Integer, Integer> placements = entry.getValue();
                    return new UserMedalsReadDTO(account.getApiAccountRead(),
                            placements.entrySet().stream()
                                    .map(p -> {
                                        String[] emojiAndColor = getEmojiAndColorFromPlacement(p.getKey());
                                        return new MedalReadDTO(emojiAndColor[0], p.getValue(), emojiAndColor[1]);
                                    })
                                    .toList());
                }).toList();
    }

    private String[] getEmojiAndColorFromPlacement(int placement) {
        if (placement == 1) {
            return new String[]{"🥇", "#FFD700"};
        } else if (placement == 2) {
            return new String[]{"🥈", "#C0C0C0"};
        } else if (placement == 3) {
            return new String[]{"🥉", "#CD7F32"};
        } else {
            return new String[]{"", ""};
        }
    }
}
