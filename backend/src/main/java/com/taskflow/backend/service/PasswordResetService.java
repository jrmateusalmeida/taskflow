
package com.taskflow.backend.service;

import com.taskflow.backend.model.PasswordResetToken;
import com.taskflow.backend.model.User;
import com.taskflow.backend.repository.PasswordResetTokenRepository;
import com.taskflow.backend.repository.UserRepository;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HexFormat;
import java.util.Locale;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
public class PasswordResetService {

    private static final int TOKEN_BYTES = 32;
    private static final int EXPIRATION_MINUTES = 30;

    private final UserRepository userRepository;
    private final PasswordResetTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;

    private final SecureRandom secureRandom = new SecureRandom();

    public PasswordResetService(
            UserRepository userRepository,
            PasswordResetTokenRepository tokenRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ========================================
    // GERAR TOKEN SEGURO
    // ========================================

    private String generateSecureToken() {

        byte[] bytes = new byte[TOKEN_BYTES];

        secureRandom.nextBytes(bytes);

        return Base64.getUrlEncoder()
                .withoutPadding()
                .encodeToString(bytes);
    }

    // ========================================
    // GERAR HASH SHA-256
    // ========================================

    private String hashToken(String token) {

        try {
            MessageDigest digest =
                    MessageDigest.getInstance("SHA-256");

            byte[] hash = digest.digest(
                    token.getBytes(StandardCharsets.UTF_8)
            );

            return HexFormat.of().formatHex(hash);

        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException(
                    "SHA-256 indisponível",
                    exception
            );
        }
    }

    // ========================================
    // SOLICITAR RECUPERAÇÃO
    // ========================================

    @Transactional
    public void requestPasswordReset(String email) {

        if (email == null || email.isBlank()) {
            return;
        }

        String normalizedEmail = email
                .trim()
                .toLowerCase(Locale.ROOT);

        User user = userRepository
                .findByEmail(normalizedEmail)
                .orElse(null);

        // Não revela se o e-mail está cadastrado.
        if (user == null) {
            return;
        }

        String rawToken = generateSecureToken();

        Instant now = Instant.now();

        PasswordResetToken resetToken =
                new PasswordResetToken();

        resetToken.setUser(user);
        resetToken.setTokenHash(hashToken(rawToken));
        resetToken.setCreatedAt(now);
        resetToken.setExpiresAt(
                now.plus(EXPIRATION_MINUTES, ChronoUnit.MINUTES)
        );

        tokenRepository.save(resetToken);

        // Pendente:
        // enviar rawToken ao e-mail do usuário.
        // Nunca armazenar ou registrar o token original.
    }

    // ========================================
    // REDEFINIR SENHA
    // ========================================

    @Transactional
    public void resetPassword(
            String rawToken,
            String newPassword) {

        if (rawToken == null
                || rawToken.isBlank()
                || newPassword == null
                || newPassword.length() < 8
                || newPassword.length() > 72) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Token ou senha inválidos"
            );
        }

        String tokenHash = hashToken(rawToken);

        PasswordResetToken resetToken = tokenRepository
                .findByTokenHashForUpdate(tokenHash)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.BAD_REQUEST,
                                "Token inválido ou expirado"
                        )
                );

        if (!resetToken.isValid()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Token inválido ou expirado"
            );
        }

        User user = resetToken.getUser();

        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        resetToken.setUsedAt(Instant.now());

        tokenRepository.save(resetToken);
    }
}
