package com.manabandhu.backend;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
public class ManaBandhuBackendApplication {

	public static void main(String[] args) {
		SpringApplication.run(ManaBandhuBackendApplication.class, args);
	}

}
