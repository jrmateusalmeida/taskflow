
package com.taskflow.backend.repository;

import com.taskflow.backend.model.PasswordResetToken;

import jakarta.persistence.LockModeType;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetTokenRepository
        extends JpaRepository<PasswordResetToken, Long> {

    // ========================================
    // BUSCAR TOKEN PELO HASH
    // ========================================

    Optional<PasswordResetToken> findByTokenHash(
            String tokenHash
    );

    // ========================================
    // BUSCAR TOKEN COM BLOQUEIO
    // ========================================

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT token
        FROM PasswordResetToken token
        WHERE token.tokenHash = :tokenHash
    """)
    Optional<PasswordResetToken> findByTokenHashForUpdate(
            @Param("tokenHash") String tokenHash
    );
}
