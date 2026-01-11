package com._madrid.linear_regression_service.infrastructure.api;

import com._madrid.linear_regression_service.Model.Vector2;
import com._madrid.linear_regression_service.application.*;
import com._madrid.linear_regression_service.application.dto.ModelConfigDTO;
import com._madrid.linear_regression_service.application.dto.ModelStateDTO;
import com._madrid.linear_regression_service.application.dto.RectResponse;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.http.codec.ServerSentEvent;
import org.springframework.http.codec.multipart.FilePart;
import org.springframework.web.bind.annotation.*;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/linear-regression")
@CrossOrigin("*")
public class LinearRegressionController {

    private final TrainService trainService;
    private final LoadDataModelService loadDataModelService;
    private final ModelService modelService;
    private final PredictService predictService;
    private final PrecisionService precisionService;
    LinearRegressionController (TrainService trainService, LoadDataModelService loadDataModelService, ModelService modelService, PredictService predictService, PrecisionService precisionService) {
        this.trainService = trainService;
        this.loadDataModelService = loadDataModelService;
        this.modelService = modelService;
        this.predictService = predictService;
        this.precisionService = precisionService;
    }
    @GetMapping("/data-train")
    public Mono<ResponseEntity<List<Vector2>>> getDataTrain() {
        return modelService.getDataTrain();
    }

    @PostMapping("/update-data-train")
    public Mono<ResponseEntity<List<Vector2>>> updateDataTrain(@RequestPart("file") FilePart filePart) {
        if (!filePart.filename().endsWith(".csv")) {
            return Mono.just(ResponseEntity.badRequest().build());
        }
        return loadDataModelService.execute(filePart);
    }

    @GetMapping(value = "/train", produces = MediaType.TEXT_EVENT_STREAM_VALUE)
    public Flux<ServerSentEvent<RectResponse>> trainModel() {
        return trainService.execute();
    }

    @PutMapping("/update-learning-rate")
    public Mono<ResponseEntity<String>> updateLearningRate(@RequestParam double learningRate) {
        return modelService.updateLearningRate(learningRate);
    }

    @PutMapping("/update-iterations")
    public Mono<ResponseEntity<String>> updateIterations(@RequestParam int iterations) {
        return modelService.updateIterations(iterations);
    }

    @GetMapping("/rect")
    public Mono<ResponseEntity<RectResponse>> getRect() {
        return modelService.getRect();
    }

    @GetMapping("/predict")
    public Mono<ResponseEntity<Map<String, String>>> predict(@RequestParam double x) {
        return predictService.execute(x);
    }

    @GetMapping("/precision")
    public Mono<Map<String, Double>> precision() {
        return precisionService.execute();
    }

    @GetMapping("/config")
    public Mono<ResponseEntity<ModelConfigDTO>> getContext() {
        return modelService.getConfig();
    }

    @GetMapping("/state")
    public Mono<ResponseEntity<ModelStateDTO>> getModelState() {
        return modelService.getModelState();
    }
    @GetMapping("/reset")
    public Mono<ResponseEntity<ModelConfigDTO>> reset() {
        return modelService.reset();
    }
}
