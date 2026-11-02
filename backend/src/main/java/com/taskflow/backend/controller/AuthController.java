
package com.taskflow.backend.controller;

import com.taskflow.backend.dto.LoginRequest;
import com.taskflow.backend.dto.LoginResponse;
import com.taskflow.backend.dto.RegisterRequest;
import com.taskflow.backend.dto.RegisterResponse;
import com.taskflow.backend.model.User;
import com.taskflow.backend.service.AuthService;
import com.taskflow.backend.service.JwtService;
import com.taskflow.backend.service.PasswordResetService;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;
    private final JwtService jwtService;
    private final PasswordResetService passwordResetService;

    public AuthController(
            AuthService authService,
            JwtService jwtService,
            PasswordResetService passwordResetService) {

        this.authService = authService;
        this.jwtService = jwtService;
        this.passwordResetService = passwordResetService;
    }

    // ========================================
    // CADASTRO
    // ========================================

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody RegisterRequest request) {

        User user = authService.register(request);

        RegisterResponse response = new RegisterResponse(
                user.getId(),
                user.getName(),
                user.getEmail()
        );

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(response);
    }

    // ========================================
    // LOGIN
    // ========================================

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @Valid @RequestBody LoginRequest request) {

        User user = authService.authenticate(request);

        String token = jwtService.generateToken(user);

        LoginResponse response = new LoginResponse(
                token,
                "Bearer",
                user.getId(),
                user.getName(),
                user.getEmail()
        );

        return ResponseEntity.ok(response);
    }

    // ========================================
    // SOLICITAR RECUPERAÇÃO DE SENHA
    // ========================================

    @PostMapping("/forgot-password")
    public ResponseEntity<MessageResponse> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request) {

        passwordResetService.requestPasswordReset(
                request.email()
        );

        return ResponseEntity.ok(
                new MessageResponse(
                        "Se o e-mail estiver cadastrado, " +
                        "você receberá instruções para redefinir sua senha."
                )
        );
    }

    // ========================================
    // REDEFINIR SENHA
    // ========================================

    @PostMapping("/reset-password")
    public ResponseEntity<MessageResponse> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request) {

        passwordResetService.resetPassword(
                request.token(),
                request.newPassword()
        );

        return ResponseEntity.ok(
                new MessageResponse(
                        "Senha redefinida com sucesso."
                )
        );
    }

    // ========================================
    // DTOs DA RECUPERAÇÃO
    // ========================================

    public record ForgotPasswordRequest(
            @NotBlank
            @Email
            String email
    ) {}

    public record ResetPasswordRequest(
            @NotBlank
            String token,

            @NotBlank
            @Size(min = 8, max = 72)
            String newPassword
    ) {}

    public record MessageResponse(
            String message
    ) {}
}
