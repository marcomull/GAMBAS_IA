package com.alura.finance_ai.controller;

import com.alura.finance_ai.dto.AuthRequest;
import com.alura.finance_ai.dto.AuthResponse;
import com.alura.finance_ai.dto.RegisterRequest;
import com.alura.finance_ai.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

// Endpoint público para que los usuarios puedan registrarse o hacer login
@RestController
@RequestMapping("/auth")
@RequiredArgsConstructor
@CrossOrigin(origins = "*") // Permite al Frontend comunicarse con esta API
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@RequestBody RegisterRequest request) {
        request.setRole("USER"); // Seguridad: Forzar siempre rol USER en registro público
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@RequestBody AuthRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }
}
