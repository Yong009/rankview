package com.example.rankview.controller;

import com.example.rankview.entity.Folder;
import com.example.rankview.repository.FolderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/folders")
public class FolderController {

    @Autowired
    private FolderRepository folderRepository;

    @GetMapping
    public List<Folder> getFolders(jakarta.servlet.http.HttpSession session) {
        String username = (String) session.getAttribute("user");
        String role = (String) session.getAttribute("role");
        if (username == null)
            return java.util.Collections.emptyList();

        // Ensure "기본 폴더" exists for the user
        if (!folderRepository.existsByNameAndUsername("기본 폴더", username)) {
            Folder defaultFolder = new Folder();
            defaultFolder.setName("기본 폴더");
            defaultFolder.setUsername(username);
            folderRepository.save(defaultFolder);
        }

        if ("ADMIN".equals(role)) {
            return folderRepository.findAll();
        }
        return folderRepository.findByUsername(username);
    }

    @PostMapping
    public Folder createFolder(@RequestBody Folder folder, jakarta.servlet.http.HttpSession session) {
        String username = (String) session.getAttribute("user");
        folder.setUsername(username);
        return folderRepository.save(folder);
    }

    @DeleteMapping("/{id}")
    public void deleteFolder(@PathVariable Long id) {
        folderRepository.deleteById(id);
    }

    @PutMapping("/{id}")
    public Folder updateFolder(@PathVariable Long id, @RequestBody Folder folderDetails) {
        Folder folder = folderRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Folder not found: " + id));
        if (folderDetails.getName() != null) {
            folder.setName(folderDetails.getName());
        }
        return folderRepository.save(folder);
    }
}
