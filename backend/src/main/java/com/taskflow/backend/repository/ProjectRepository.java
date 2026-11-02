
package com.taskflow.backend.repository;

import com.taskflow.backend.model.Project;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ProjectRepository
        extends JpaRepository<Project, Long> {

    // Verifica se já existe um projeto com esse nome
    boolean existsByName(String name);

    // Lista os projetos pertencentes ao usuário
    List<Project> findByUserId(Long userId);

    // Busca um projeto pelo ID e pelo proprietário
    Optional<Project> findByIdAndUserId(
            Long id,
            Long userId
    );

    // Verifica se o usuário possui determinado projeto
    boolean existsByIdAndUserId(
            Long id,
            Long userId
    );

    // Verifica nomes repetidos para o mesmo usuário
    boolean existsByNameAndUserId(
            String name,
            Long userId
    );
}
