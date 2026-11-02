
package com.taskflow.backend.controller;

import com.taskflow.backend.model.Task;
import com.taskflow.backend.model.User;
import com.taskflow.backend.repository.TaskRepository;
import com.taskflow.backend.repository.UserRepository;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/tasks")
public class TaskController {

    private final TaskRepository repository;
    private final UserRepository userRepository;

    public TaskController(
            TaskRepository repository,
            UserRepository userRepository) {

        this.repository = repository;
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<Task> list(
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        return repository.findByUserId(userId);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Task> findById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        return repository.findByIdAndUserId(id, userId)
                .map(ResponseEntity::ok)
                .orElseGet(() ->
                        ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Task> create(
            @RequestBody Task task,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        User user = userRepository.findById(userId)
                .orElseThrow(() ->
                        new ResponseStatusException(
                                HttpStatus.UNAUTHORIZED,
                                "Usuário não encontrado"));

        task.setId(null);
        task.setUser(user);

        Task saved = repository.save(task);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(saved);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Task> update(
            @PathVariable Long id,
            @RequestBody Task data,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        Optional<Task> existing =
                repository.findByIdAndUserId(id, userId);

        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        Task task = existing.get();

        task.setTitle(data.getTitle());
        task.setDescription(data.getDescription());
        task.setStatus(data.getStatus());
        task.setPriority(data.getPriority());
        task.setProject(data.getProject());
        task.setDueDate(data.getDueDate());

        task.setSubtasks(data.getSubtasks());
        task.setComments(data.getComments());
        task.setActivity(data.getActivity());

        Task updated = repository.save(task);

        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt) {

        Long userId = Long.valueOf(jwt.getSubject());

        Optional<Task> existing =
                repository.findByIdAndUserId(id, userId);

        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }

        repository.delete(existing.get());

        return ResponseEntity.noContent().build();
    }
}
