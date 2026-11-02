
package com.taskflow.backend.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.server.ResponseStatusException;

import com.taskflow.backend.model.User;
import com.taskflow.backend.repository.UserRepository;

@RestController
@RequestMapping("/api/users")
public class UserController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public UserController(
            UserRepository userRepository,
            PasswordEncoder passwordEncoder) {

        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    // ========================================
    // BUSCAR USUÁRIO AUTENTICADO
    // ========================================

    private User getAuthenticatedUser(Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        return userRepository.findById(userId)
                .orElseThrow(() -> new ResponseStatusException(
                        HttpStatus.NOT_FOUND,
                        "Usuário não encontrado."
                ));
    }

    // ========================================
    // CONSULTAR MEU PERFIL
    // ========================================

    @GetMapping("/me")
    public Map<String, Object> me(
            @AuthenticationPrincipal Jwt jwt) {

        User user = getAuthenticatedUser(jwt);

        return Map.of(
                "userId", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "authenticated", true
        );
    }

    // ========================================
    // ATUALIZAR MEU NOME
    // ========================================

    @PutMapping("/me")
    public Map<String, Object> updateMe(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> request) {

        User user = getAuthenticatedUser(jwt);

        String name = request.get("name");

        if (name == null || name.trim().isEmpty()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O nome não pode estar vazio."
            );
        }

        name = name.trim();

        if (name.length() > 100) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "O nome deve ter no máximo 100 caracteres."
            );
        }

        user.setName(name);

        User updatedUser = userRepository.save(user);

        return Map.of(
                "userId", updatedUser.getId(),
                "name", updatedUser.getName(),
                "email", updatedUser.getEmail(),
                "authenticated", true
        );
    }

    // ========================================
    // ALTERAR MINHA SENHA
    // ========================================

    @PutMapping("/me/password")
    public Map<String, String> changePassword(
            @AuthenticationPrincipal Jwt jwt,
            @RequestBody Map<String, String> request) {

        User user = getAuthenticatedUser(jwt);

        String currentPassword = request.get("currentPassword");
        String newPassword = request.get("newPassword");

        // Valida campos obrigatórios
        if (currentPassword == null ||
                currentPassword.isEmpty() ||
                newPassword == null ||
                newPassword.isEmpty()) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Informe a senha atual e a nova senha."
            );
        }

        // Confirma a senha atual
        if (!passwordEncoder.matches(
                currentPassword,
                user.getPasswordHash())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A senha atual está incorreta."
            );
        }

        // Valida o tamanho da nova senha
        if (newPassword.length() < 8) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ter pelo menos 8 caracteres."
            );
        }

        // Impede reutilizar a mesma senha
        if (passwordEncoder.matches(
                newPassword,
                user.getPasswordHash())) {

            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "A nova senha deve ser diferente da atual."
            );
        }

        // Criptografa e salva a nova senha
        user.setPasswordHash(
                passwordEncoder.encode(newPassword)
        );

        userRepository.save(user);

        return Map.of(
                "message",
                "Senha alterada com sucesso."
        );
    }
}
