/*
 * Copyright 2026 Navilla
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package app.navilla.config;

import java.util.Arrays;
import java.util.List;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

/**
 * Security configuration for the Navilla backend.
 *
 * <p>Configures JWT-based authentication using Supabase as the identity provider.
 * All API endpoints under /api/** require authentication except for explicitly
 * permitted public endpoints.
 *
 * @author Navilla Team
 * @since 2026-01-30
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

  @Value("${navilla.supabase.url}")
  private String supabaseUrl;

  @Value("${spring.security.oauth2.resourceserver.jwt.jwk-set-uri:}")
  private String jwkSetUri;

  /**
   * Configures the security filter chain.
   *
   * <p>Sets up:
   * <ul>
   *   <li>CORS configuration for frontend access</li>
   *   <li>CSRF disabled (stateless API)</li>
   *   <li>Stateless session management</li>
   *   <li>JWT-based authentication for protected endpoints</li>
   *   <li>Public access for health and info endpoints</li>
   * </ul>
   *
   * @param http the HttpSecurity to configure
   * @return the configured SecurityFilterChain
   * @throws Exception if configuration fails
   */
  @Bean
  public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
    return http
        .cors(cors -> cors.configurationSource(corsConfigurationSource()))
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session ->
            session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
        .authorizeHttpRequests(auth -> auth
            // Public endpoints
            .requestMatchers("/actuator/health", "/actuator/info").permitAll()
            .requestMatchers("/api/health").permitAll()
            .requestMatchers("/error").permitAll()
            // All other API endpoints require authentication
            .requestMatchers("/api/**").authenticated()
            .anyRequest().denyAll())
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.decoder(jwtDecoder())))
        .headers(headers -> headers
            .contentSecurityPolicy(csp ->
                csp.policyDirectives("default-src 'self'"))
            .frameOptions(frame -> frame.deny())
            .contentTypeOptions(content -> {})
            .httpStrictTransportSecurity(hsts ->
                hsts.includeSubDomains(true).maxAgeInSeconds(31536000)))
        .build();
  }

  /**
   * Creates the JWT decoder for validating Supabase tokens.
   *
   * <p>Uses the Supabase JWKS endpoint to fetch public keys for token validation.
   *
   * @return configured JwtDecoder
   */
  @Bean
  public JwtDecoder jwtDecoder() {
    String effectiveJwkUri = jwkSetUri.isEmpty()
        ? supabaseUrl + "/auth/v1/.well-known/jwks.json"
        : jwkSetUri;
    return NimbusJwtDecoder.withJwkSetUri(effectiveJwkUri).build();
  }

  /**
   * Configures CORS settings for the API.
   *
   * <p>Allows requests from localhost during development and the production domain.
   *
   * @return the CORS configuration source
   */
  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOrigins(Arrays.asList(
        "http://localhost:5173",  // Vite dev server
        "http://localhost:3000",  // Alternative dev port
        "https://navilla.app",    // Production
        "https://www.navilla.app" // Production with www
    ));
    configuration.setAllowedMethods(Arrays.asList(
        "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
    configuration.setAllowedHeaders(List.of("*"));
    configuration.setExposedHeaders(Arrays.asList(
        "Authorization", "Content-Type", "X-Request-Id"));
    configuration.setAllowCredentials(true);
    configuration.setMaxAge(3600L);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/api/**", configuration);
    return source;
  }
}
