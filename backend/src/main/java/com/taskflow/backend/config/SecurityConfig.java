
package com.taskflow.backend.config;

import java.util.List;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(
            HttpSecurity http) throws Exception {

        http
            .cors(cors -> {})
            .csrf(csrf -> csrf.disable())

            // API sem sessão HTTP
            .sessionManagement(session ->
                session.sessionCreationPolicy(
                    SessionCreationPolicy.STATELESS
                )
            )

            // Permissões dos endpoints
            .authorizeHttpRequests(auth -> auth

                // Verificação de saúde pública
                .requestMatchers(
                    HttpMethod.GET,
                    "/api/health"
                ).permitAll()

                // Cadastro, login e recuperação de senha
                .requestMatchers(
                    HttpMethod.POST,
                    "/api/auth/register",
                    "/api/auth/login",
                    "/api/auth/forgot-password",
                    "/api/auth/reset-password"
                ).permitAll()

                // Tarefas protegidas por JWT
                .requestMatchers(
                    "/api/tasks",
                    "/api/tasks/**"
                ).authenticated()

                // Projetos protegidos por JWT
                .requestMatchers(
                    "/api/projects",
                    "/api/projects/**"
                ).authenticated()

                // Tratamento de erros
                .requestMatchers("/error").permitAll()

                // Demais endpoints protegidos
                .anyRequest().authenticated()
            )

            // Validação do token JWT
            .oauth2ResourceServer(oauth2 ->
                oauth2.jwt(jwt -> {})
            )

            // Desativa HTTP Basic
            .httpBasic(basic -> basic.disable())

            // Desativa login padrão do Spring
            .formLogin(form -> form.disable());

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {

        CorsConfiguration config = new CorsConfiguration();

        // Frontend React
        config.setAllowedOrigins(
            List.of("http://localhost:5173")
        );

        // Métodos HTTP permitidos
        config.setAllowedMethods(
            List.of(
                "GET",
                "POST",
                "PUT",
                "DELETE",
                "OPTIONS"
            )
        );

        // Cabeçalhos permitidos
        config.setAllowedHeaders(
            List.of(
                "Content-Type",
                "Authorization"
            )
        );

        UrlBasedCorsConfigurationSource source =
            new UrlBasedCorsConfigurationSource();

        source.registerCorsConfiguration(
            "/api/**",
            config
        );

        return source;
    }
}
