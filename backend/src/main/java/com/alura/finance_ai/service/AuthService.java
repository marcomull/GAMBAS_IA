package com.alura.finance_ai.service;

import com.alura.finance_ai.config.JwtUtil;
import com.alura.finance_ai.dto.AuthRequest;
import com.alura.finance_ai.dto.AuthResponse;
import com.alura.finance_ai.dto.RegisterRequest;
import com.alura.finance_ai.exception.UserAlreadyExistsException;
import com.alura.finance_ai.model.Role;
import com.alura.finance_ai.model.UserEntity;
import com.alura.finance_ai.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

// Lógica de negocio para manejar logins y registros
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;
    private final AuthenticationManager authenticationManager;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.findByUsername(request.getUsername()).isPresent()) {
            throw new UserAlreadyExistsException("El usuario ya existe");
        }

        Role assignedRole = Role.USER;
        if ("ADMIN".equalsIgnoreCase(request.getRole())) {
            assignedRole = Role.ADMIN;
        }

        UserEntity user = UserEntity.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(assignedRole)
                .build();

        userRepository.save(user);

        String jwt = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .build();
    }

    public AuthResponse login(AuthRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        UserEntity user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new RuntimeException("Usuario no encontrado"));

        String jwt = jwtUtil.generateToken(user);
        return AuthResponse.builder()
                .token(jwt)
                .role(user.getRole().name())
                .build();
    }
}
