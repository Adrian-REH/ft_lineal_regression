package com._madrid.linear_regression_service.application;

import com._madrid.linear_regression_service.Model.Rect;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelState;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class PredictService {
    private final ModelStore modelStore;

    public PredictService(ModelStore modelStore) {
        this.modelStore = modelStore;
    }

    public Mono<ResponseEntity<Map<String, String>>> execute(double x) {
        if (!modelStore.getModelState().equals(ModelState.TRAINED)) {
            return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of("Error", "Model Don't trained")));
        }

        Rect rect = modelStore.getRect();
        double y =  rect.getM() * x + rect.getB();
        return Mono.just(ResponseEntity.ok().body(Map.of("y", Double.toString(y))));

    }
}

