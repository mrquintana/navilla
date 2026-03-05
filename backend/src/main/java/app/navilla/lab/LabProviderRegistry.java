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

package app.navilla.lab;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.stereotype.Component;

/**
 * Registry that indexes all {@link LabProvider} beans by provider code.
 */
@Component
public class LabProviderRegistry {

  private final Map<String, LabProvider> providers;

  public LabProviderRegistry(List<LabProvider> providers) {
    this.providers = providers.stream()
        .collect(Collectors.toMap(LabProvider::getProviderCode, Function.identity()));
  }

  public Optional<LabProvider> getProvider(String code) {
    return Optional.ofNullable(providers.get(code));
  }
}
