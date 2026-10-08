package com.utility.software.controller;

import com.utility.software.dto.MeterView;
import com.utility.software.service.MeterService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/meters")
public class MeterController {

    private final MeterService service;

    public MeterController(MeterService service) {
        this.service = service;
    }

    /** Real Time Data View table */
    @GetMapping
    public List<MeterView> getAll() {
        return service.getAll();
    }

    /** Refresh button */
    @PostMapping("/refresh")
    public List<MeterView> refresh() {
        return service.refresh();
    }
}
