
// Component B (different screen)
const { data: habits } = useHabits(); 
// Gets the SAME cached data, no additional API call!
```

## Best Practices

### 1. Use Descriptive Variable Names
```typescript
// Good
const { data: habits, isLoading: habitsLoading } = useHabits();

// Avoid
const { data, isLoading } = useHabits();
```

### 2. Provide Default Values
```typescript
const { data: habits = [] } = useHabits();
// Now habits is never undefined
```

### 3. Handle Loading States
```typescript
const { data: habit, isLoading, error } = useHabit(uuid);

if (isLoading) return <ActivityIndicator />;
if (error) return <Text>Error loading habit</Text>;
if (!habit) return <Text>Habit not found</Text>;

return <HabitDetails habit={habit} />;
```

### 4. Use Mutations for Side Effects
```typescript
const createHabitMutation = useCreateHabit();

const handleCreate = async () => {
  try {
    const newHabit = await createHabitMutation.mutateAsync(habitData);
    // Navigate or show success message
    router.push(`/habit/${newHabit.uuid}`);
  } catch (error) {
    alert('Failed to create habit');
  }
};
```

### 5. Manual Refetching When Needed
```typescript
const { data: habits, refetch } = useHabits();

// User pulls to refresh
const handleRefresh = () => {
  refetch();
};
```

## Cache Invalidation

The hooks automatically handle cache invalidation, but you can manually invalidate if needed:

```typescript
import { useQueryClient } from '@tanstack/react-query';
import { habitKeys } from '@/hooks/useHabits';

const queryClient = useQueryClient();

// Invalidate all habits
queryClient.invalidateQueries({ queryKey: habitKeys.all });

// Invalidate specific habit
queryClient.invalidateQueries({ queryKey: habitKeys.detail(uuid) });

// Clear all cache
queryClient.clear();
```

## Common Patterns

### Pattern 1: List + Detail Views
```typescript
// List screen
const { data: habits = [] } = useHabits();

// Detail screen
const { data: habit } = useHabit(habitUuid);
// If habit is in list cache, shows immediately!
```

### Pattern 2: Optimistic Updates
Already built into mutations! When you delete a habit, it's removed from the UI immediately, even before the server responds.

### Pattern 3: Background Refetching
Data automatically refetches when:
- Component remounts
- Window regains focus (disabled on mobile)
- Network reconnects
- Data becomes stale (configurable per-query)

## Available Hooks

### Habits
- `useHabits()` - Get all habits
- `useHabit(uuid)` - Get single habit
- `useHabitPercentageHistory(uuid, month)` - Get percentage history
- `useConnectedHabits(uuid)` - Get connected habits
- `useHabitParticipants(uuid)` - Get participants
- `useHabitRecords(habitUuid, from?, to?)` - Get records
- `useCreateHabit()` - Create habit mutation
- `useUpdateHabit()` - Update habit mutation
- `useDeleteHabit()` - Delete habit mutation
- `useCreateHabitRecord()` - Create record mutation
- `useMoveHabitUp()` / `useMoveHabitDown()` - Reorder mutations

### Users
- `useUserInfo()` - Get current user info
- `useUserSettings()` - Get user settings
- `useUnapprovedUsers()` - Get unapproved users
- `useUpdateUserSettings()` - Update settings mutation
- `useApproveUser()` - Approve user mutation

### Shared Habits
- `useSharedHabits()` - Get all shared habits
- `useSharedHabit(shareCode)` - Get single shared habit
- `useSharedHabitMedals(shareCode)` - Get medals
- `useCreateSharedHabit()` - Create mutation
- `useJoinSharedHabit()` - Join mutation
- `useLeaveSharedHabit()` - Leave mutation

### Challenges
- `useChallengeOverview()` - Get challenge overview
- `useChallenges()` - Get all challenges
- `useChallenge(id)` - Get single challenge
- `useCreateChallenge()` - Create mutation
- `useVoteOnChallenge()` - Vote mutation

### Notifications
- `useUpdateNotificationForHabit()` - Update notification
- `useDeleteNotificationForHabit()` - Delete notification
- `useAddNumberToModal()` - Add number to modal
- `useRemoveNumberFromModal()` - Remove number from modal

## When NOT to Use React Query

- One-time operations (login, logout)
- File uploads (use plain fetch/axios)
- WebSocket connections (use separate library)
- Non-REST APIs that don't fit the pattern

For these cases, continue using the `api.ts` functions directly.

## Troubleshooting

### Data Not Updating After Mutation
Check if the mutation invalidates the correct query keys. See the mutation implementation in the hooks files.

### Too Many API Calls
Adjust `staleTime` in the query options. Higher values = fewer refetches.

### Cache Not Shared Between Components
Make sure both components use the same hook with the same parameters.

### Need Fresh Data Every Time
Set `staleTime: 0` in query options or use `refetch()` manually.

## Further Reading

- [TanStack Query Docs](https://tanstack.com/query/latest/docs/react/overview)
- [React Query Best Practices](https://tkdodo.eu/blog/practical-react-query)
# React Query Hooks Guide

This guide explains how to use React Query hooks in HabitSync to handle API calls with automatic caching, background updates, and optimistic updates.

## Table of Contents
- [Setup](#setup)
- [Why React Query?](#why-react-query)
- [Migration Strategy](#migration-strategy)
- [Usage Examples](#usage-examples)
- [Best Practices](#best-practices)
- [Cache Invalidation](#cache-invalidation)

## Setup

The QueryClient provider is already configured in `_layout.tsx`. All hooks are ready to use.

## Why React Query?

React Query solves several problems:
- **Automatic caching**: Data is cached and reused across components
- **Background updates**: Stale data is automatically refetched
- **Optimistic updates**: UI updates immediately before server confirms
- **Deduplication**: Multiple components requesting same data only trigger one API call
- **Loading/error states**: Built-in state management for async operations

## Migration Strategy

**You DON'T need to rewrite everything at once!** The old API functions still work perfectly.

### Gradual Migration Approach:

1. **New features**: Use React Query hooks
2. **Existing features with caching issues**: Migrate to hooks
3. **Simple, working features**: Leave as-is (optional to migrate)

### The Two Patterns Can Coexist:

```typescript
// OLD WAY (still works fine)
const fetchHabits = async () => {
  const habits = await habitApi.getUserHabits();
  setHabits(habits);
};

// NEW WAY (with React Query)
const { data: habits, isLoading, error } = useHabits();
```

## Usage Examples

### Example 1: Fetching Data (useQuery)

**Before:**
```typescript
const [habits, setHabits] = useState<ApiHabitRead[]>([]);
const [loading, setLoading] = useState(true);

const loadHabits = async () => {
  try {
    setLoading(true);
    const data = await habitApi.getUserHabits();
    setHabits(data);
  } catch (error) {
    console.error(error);
  } finally {
    setLoading(false);
  }
};

useFocusEffect(
  useCallback(() => {
    loadHabits();
  }, [])
);
```

**After:**
```typescript
import { useHabits } from '@/hooks/useHabits';

const { data: habits = [], isLoading, error, refetch } = useHabits();

// That's it! The data is cached and shared across all components
// Use refetch() if you need to manually refresh
```

### Example 2: Mutating Data (useMutation)

**Before:**
```typescript
const deleteHabit = async (uuid: string) => {
  try {
    await habitApi.deleteHabit(uuid);
    // Manually update local state
    setHabits(habits.filter(h => h.uuid !== uuid));
  } catch (error) {
    alert('Failed to delete habit');
  }
};
```

**After:**
```typescript
import { useDeleteHabit } from '@/hooks/useHabits';

const deleteHabitMutation = useDeleteHabit();

const deleteHabit = async (uuid: string) => {
  try {
    await deleteHabitMutation.mutateAsync(uuid);
    // Cache is automatically updated!
    // All components using useHabits() will see the change
  } catch (error) {
    alert('Failed to delete habit');
  }
};
```

### Example 3: Creating a Record (Complex Mutation)

**Before:**
```typescript
const createRecord = async (epochDay: number, value: number) => {
  try {
    await habitRecordApi.createRecord(habitUuid, { epochDay, recordValue: value });
    // Manually refetch habit to get updated percentage
    const updated = await habitApi.getHabitByUuid(habitUuid);
    setHabitDetail(updated);
  } catch (error) {
    alert('Failed to create record');
  }
};
```

**After:**
```typescript
import { useCreateHabitRecord } from '@/hooks/useHabits';

const createRecordMutation = useCreateHabitRecord();

const createRecord = async (epochDay: number, value: number) => {
  try {
    await createRecordMutation.mutateAsync({
      habitUuid,
      record: { epochDay, recordValue: value }
    });
    // Automatically invalidates:
    // - Habit detail (percentage updates)
    // - Habit list (all percentages)
    // - Records list
    // - Percentage history
  } catch (error) {
    alert('Failed to create record');
  }
};
```

### Example 4: Real-time Status Updates

```typescript
import { useUpdateHabit } from '@/hooks/useHabits';

const updateMutation = useUpdateHabit();

<Button 
  onPress={() => updateMutation.mutate(habitData)}
  disabled={updateMutation.isPending}
>
  {updateMutation.isPending ? 'Saving...' : 'Save'}
</Button>
```

### Example 5: Conditional Fetching

```typescript
// Only fetch if user is authenticated
const { data: userSettings } = useUserSettings();

// Only fetch habit details when habitUuid exists
const { data: habit } = useHabit(habitUuid, Boolean(habitUuid));
```

### Example 6: Accessing Data Across Components

The magic of React Query is that data is shared:

```typescript
// Component A
const { data: habits } = useHabits();

