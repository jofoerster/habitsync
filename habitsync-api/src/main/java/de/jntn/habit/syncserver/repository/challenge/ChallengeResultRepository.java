package de.jntn.habit.syncserver.repository.challenge;

import de.jntn.habit.syncserver.model.challenge.ChallengeResult;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ChallengeResultRepository extends JpaRepository<ChallengeResult, Long> {
    List<ChallengeResult> findAllByPlacementLessThanEqual(Integer placementIsLessThan);
}
