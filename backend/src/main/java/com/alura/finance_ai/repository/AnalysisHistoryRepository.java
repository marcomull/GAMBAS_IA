package com.alura.finance_ai.repository;

import com.alura.finance_ai.model.AnalysisHistoryEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AnalysisHistoryRepository extends JpaRepository<AnalysisHistoryEntity, Long> {
    List<AnalysisHistoryEntity> findByUserIdOrderByFechaAnalisisDesc(Long userId);
}
