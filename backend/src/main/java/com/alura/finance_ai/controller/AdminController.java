package com.alura.finance_ai.controller;

import com.alura.finance_ai.model.UserEntity;
import com.alura.finance_ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

// Endpoints restringidos estrictamente a usuarios con rol ADMIN
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final com.alura.finance_ai.service.AuthService authService;

    @GetMapping("/users")
    public ResponseEntity<List<UserEntity>> getAllUsers() {
        return ResponseEntity.ok(userRepository.findAll());
    }

    @PostMapping("/users/admin")
    public ResponseEntity<com.alura.finance_ai.dto.AuthResponse> createAdmin(@org.springframework.web.bind.annotation.RequestBody com.alura.finance_ai.dto.RegisterRequest request) {
        request.setRole("ADMIN");
        return ResponseEntity.ok(authService.register(request));
    }
    
    @GetMapping("/dashboard")
    public ResponseEntity<String> getDashboardStats() {
        return ResponseEntity.ok("Bienvenido al panel de administración. Solo los administradores pueden ver esto.");
    }
}
