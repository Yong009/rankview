package com.example.rankview;

import com.example.rankview.entity.Folder;
import com.example.rankview.entity.KeywordRank;
import com.example.rankview.entity.User;
import com.example.rankview.repository.FolderRepository;
import com.example.rankview.repository.KeywordRankRepository;
import com.example.rankview.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;
import javax.sql.DataSource;
import java.sql.Connection;
import java.sql.Statement;
import java.sql.ResultSet;

import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.servlet.support.SpringBootServletInitializer;

@SpringBootApplication
public class RankViewApplication extends SpringBootServletInitializer {

    @Override
    protected SpringApplicationBuilder configure(SpringApplicationBuilder application) {
        return application.sources(RankViewApplication.class);
    }

    public static void main(String[] args) {
        SpringApplication.run(RankViewApplication.class, args);
    }

    @Bean
    public CommandLineRunner initData(FolderRepository folderRepository, KeywordRankRepository keywordRepository,
            UserRepository userRepository, DataSource dataSource) {
        return args -> {
            // --- Auto DB Migration Start ---
            try (Connection conn = dataSource.getConnection();
                 Statement stmt = conn.createStatement()) {
                
                // Add price column if not exists
                try {
                    stmt.execute("ALTER TABLE keyword_rank ADD COLUMN price INTEGER DEFAULT 0");
                } catch (Exception e) {} // Column might already exist
                
                // Add image_url column if not exists
                try {
                    stmt.execute("ALTER TABLE keyword_rank ADD COLUMN image_url TEXT");
                } catch (Exception e) {}
                
                // Create daily data table
                stmt.execute("""
                    CREATE TABLE IF NOT EXISTS keyword_daily_data (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        keyword_id INTEGER,
                        date TEXT,
                        inflow_count INTEGER DEFAULT 0,
                        daily_memo TEXT,
                        FOREIGN KEY (keyword_id) REFERENCES keyword_rank(id)
                    )
                """);
            } catch (Exception e) {
                System.err.println("Migration error: " + e.getMessage());
            }
            // --- Auto DB Migration End ---

            String adminUser = "test123123";
            // Ensure Admin user exists in DB
            if (userRepository.findByUsername(adminUser).isEmpty()) {
                User admin = new User();
                admin.setUsername(adminUser);
                admin.setPassword("123123");
                admin.setRole("ADMIN");
                userRepository.save(admin);
            }

            Folder folder = folderRepository.findByNameAndUsername("생활용품", adminUser)
                    .orElseGet(() -> {
                        Folder f = new Folder();
                        f.setName("생활용품");
                        f.setUsername(adminUser);
                        return folderRepository.save(f);
                    });

            String kwLabel = "리퀴드 라벤더 1챔버 캡슐세제 200개입 / 8배 초고농축 중성 대용량 세탁세제";
            if (keywordRepository.findByFolderId(folder.getId()).stream()
                    .noneMatch(k -> kwLabel.equals(k.getKeyword()))) {
                KeywordRank k = new KeywordRank();
                k.setKeyword(kwLabel);
                k.setMid("87495077064");
                k.setStoreName("제이투월드");
                k.setFolder(folder);
                k.setCurrentRank("1");
                k.setLink("https://smartstore.naver.com/rankview/products/9373322143");
                keywordRepository.save(k);
            }
        };
    }
}
