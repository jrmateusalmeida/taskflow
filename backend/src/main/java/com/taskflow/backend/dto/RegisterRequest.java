
package com.taskflow.backend.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(

    @NotBlank(message = "O nome é obrigatório")
    @Size(max = 100)
    String name,

    @NotBlank(message = "O e-mail é obrigatório")
    @Email(message = "Informe um e-mail válido")
    String email,

    @NotBlank(message = "A senha é obrigatória")
    @Size(
        min = 8,
        message = "A senha deve ter pelo menos 8 caracteres"
    )
    String password

) {}
