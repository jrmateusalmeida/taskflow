
package com.taskflow.backend.controller;

import com.taskflow.backend.model.Project;
import com.taskflow.backend.model.User;
import com.taskflow.backend.repository.ProjectRepository;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Objects;

@RestController
@RequestMapping("/api/projects")
public class ProjectController {

    private final ProjectRepository projectRepository;
    private final TaskRepository taskRepository;
    private final UserRepository userRepository;

    public ProjectController(
            ProjectRepository projectRepository,
            TaskRepository taskRepository,
            UserRepository userRepository) {

        this.projectRepository = projectRepository;
        this.taskRepository = taskRepository;
        this.userRepository = userRepository;
    }

    // LISTAR PROJETOS DO USUÁRIO

    @GetMapping
    public List<Project> list(
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        return projectRepository.findByUserId(userId);
    }

    // BUSCAR PROJETO POR ID

    @GetMapping("/{id}")
    public ResponseEntity<Project> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        Project project = projectRepository
                .findByIdAndUserId(id, userId)
                .orElse(null);

        if (project == null) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.ok(project);
    }

    // CRIAR PROJETO

    @PostMapping
    public ResponseEntity<Project> create(
            @RequestBody Project project,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        if (project.getName() == null ||
                project.getName().isBlank()) {

            return ResponseEntity.badRequest().build();
        }

        String name = project.getName().trim();

        // A restrição global de nome único
        // ainda existe no banco nesta etapa.
        if (projectRepository.existsByName(name)) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado"));

        project.setId(null);
        project.setName(name);
        project.setUser(user);

        Project saved = projectRepository.save(project);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    // ATUALIZAR PROJETO

    @PutMapping("/{id}")
    public ResponseEntity<Project> update(
            @PathVariable Long id,
            @RequestBody Project data,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        Project project = projectRepository
                .findByIdAndUserId(id, userId)
                .orElse(null);

        if (project == null) {
            return ResponseEntity.notFound().build();
        }

        if (data.getName() == null ||
                data.getName().isBlank()) {

            return ResponseEntity.badRequest().build();
        }

        String newName = data.getName().trim();

        boolean nameChanged =
                !project.getName().equals(newName);

        // Mantemos a verificação global enquanto
        // o banco ainda tiver UNIQUE(name).
        if (nameChanged &&
                projectRepository.existsByName(newName)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }

        // Impede renomear projetos com tarefas
        // pertencentes ao usuário autenticado.
        if (nameChanged &&
                hasTasks(project.getName(), userId)) {

            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }

        project.setName(newName);
        project.setDescription(data.getDescription());
        project.setColor(data.getColor());

        Project saved = projectRepository.save(project);

        return ResponseEntity.ok(saved);
    }

    // EXCLUIR PROJETO

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        Project project = projectRepository
                .findByIdAndUserId(id, userId)
                .orElse(null);

        if (project == null) {
            return ResponseEntity.notFound().build();
        }

        if (hasTasks(project.getName(), userId)) {
            return ResponseEntity
                    .status(HttpStatus.CONFLICT)
                    .build();
        }

        projectRepository.delete(project);

        return ResponseEntity.noContent().build();
    }

    // VERIFICAR TAREFAS DO USUÁRIO
    // ASSOCIADAS AO PROJETO

    private boolean hasTasks(
            String projectName,
            Long userId) {

        return taskRepository.findByUserId(userId)
                .stream()
                .anyMatch(task ->
                        Objects.equals(
                                task.getProject(),
                                projectName
                        )
                );
    }
}
