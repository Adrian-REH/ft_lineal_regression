package com._madrid.linear_regression_service.application;

import com._madrid.linear_regression_service.Model.Rect;
import com._madrid.linear_regression_service.Model.TrainCTX;
import com._madrid.linear_regression_service.Model.Vector2;
import com._madrid.linear_regression_service.application.dto.ModelConfigDTO;
import com._madrid.linear_regression_service.application.dto.ModelStateDTO;
import com._madrid.linear_regression_service.application.dto.RectResponse;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelState;
import com._madrid.linear_regression_service.infrastructure.datastore.ModelStore;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;

@Service
public class ModelService {

    private final ModelStore modelStore;

    public ModelService(ModelStore modelStore) {
        this.modelStore = modelStore;
    }


    public Mono<ResponseEntity<String>> updateIterations(int iterations) {
        if (iterations < 0) {
            return Mono.just(ResponseEntity.badRequest().body("El numero de iteraciones es incorrecto"));
        }
        if (modelStore.getModelState().equals(ModelState.TRAINING)) {
            return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("No es posible modificar las iteraciones en este momento")
            );
        }
        TrainCTX ctx = modelStore.getTrainCtx();
        modelStore.setTrainCtx(ctx.updateIterations(iterations));
        return Mono.just(ResponseEntity.ok().body("Iterations update"));
    }
    public Mono<ResponseEntity<String>> updateLearningRate(double learningRate) {
        if (learningRate <= 0) return Mono.just(ResponseEntity.badRequest().body("Bad Learning Rate"));
        if (modelStore.getModelState().equals(ModelState.TRAINING)) {
            return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT)
                    .body("No es posible modificar Learning Rate en este momento")
            );
        }
        TrainCTX ctx = modelStore.getTrainCtx();
        modelStore.setTrainCtx(ctx.updateLearningRate(learningRate));
        return Mono.just(ResponseEntity.ok("Learning Rate update"));
    }

    public Mono<ResponseEntity<RectResponse>> getRect() {
        if (modelStore.getModelState().equals(ModelState.TRAINING)) {
            return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).build());
        }
        Rect rect = modelStore.getRect();
        return Mono.just(ResponseEntity.ok(new RectResponse(rect.getM(), rect.getB(), rect.getIteration())));
    }

    public Mono<ResponseEntity<ModelConfigDTO>> getConfig() {
        TrainCTX trainCTX = modelStore.getTrainCtx();
        return Mono.just(ResponseEntity.ok(new ModelConfigDTO(trainCTX.iterations(), trainCTX.learningRate())));
    }

    public Mono<ResponseEntity<ModelStateDTO>> getModelState() {
        return Mono.just(ResponseEntity.ok(new ModelStateDTO(modelStore.getModelState())));
    }

    public Mono<ResponseEntity<List<Vector2>>> getDataTrain() {
        if (!modelStore.getModelState().equals(ModelState.TRAINED) && !modelStore.getModelState().equals(ModelState.FILE_PROCESSED)) {
            return Mono.just(ResponseEntity.noContent().build());
        }
        TrainCTX trainCTX = modelStore.getTrainCtx();
        return Mono.just(ResponseEntity.ok(trainCTX.vector2s()));

    }

    public Mono<ResponseEntity<ModelConfigDTO>> reset() {
        if (modelStore.getModelState().equals(ModelState.TRAINING))
            return Mono.just(ResponseEntity.status(HttpStatus.CONFLICT).build());
        TrainCTX trainCTX = modelStore.reset();
        return Mono.just(ResponseEntity.ok(new ModelConfigDTO(trainCTX.iterations(), trainCTX.learningRate())));

    }
}
