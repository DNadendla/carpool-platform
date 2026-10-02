package com.carpool.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import tools.jackson.databind.JsonNode;

@Service
public class GeoapifyService {

  private final RestClient restClient;
  private final String apiKey;
  private final String urlPath;

  public GeoapifyService(
      @Value("${geoapify.api-key}") String apiKey,
      @Value("${geoapify.base-url}") String baseUrl,
      @Value("${geoapify.url-path}") String urlPath) {

    this.restClient = RestClient.builder().baseUrl(baseUrl).build();

    this.apiKey = apiKey;
    this.urlPath = urlPath;
  }

  public JsonNode autocomplete(String text) {

    return restClient
        .get()
        .uri(
            uriBuilder ->
                uriBuilder
                    .path(urlPath)
                    .queryParam("text", text)
                    .queryParam("limit", 5)
                    .queryParam("filter", "countrycode:in")
                    .queryParam("format", "json")
                    .queryParam("apiKey", apiKey)
                    .build())
        .retrieve()
        .body(JsonNode.class);
  }
}
