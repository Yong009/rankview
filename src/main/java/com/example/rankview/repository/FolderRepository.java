package com.example.rankview.repository;

import com.example.rankview.entity.Folder;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface FolderRepository extends JpaRepository<Folder, Long> {
    List<Folder> findByUsername(String username);

    Optional<Folder> findByNameAndUsername(String name, String username);

    boolean existsByNameAndUsername(String name, String username);
}
