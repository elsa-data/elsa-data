import * as $protobuf from "protobufjs";
/** Namespace org. */
export namespace org {
  /** Namespace phenopackets. */
  namespace phenopackets {
    /** Namespace schema. */
    namespace schema {
      /** Namespace v2. */
      namespace v2 {
        /** Properties of a Phenopacket. */
        interface IPhenopacket {
          /** Phenopacket id */
          id?: string | null;

          /** Phenopacket subject */
          subject?: org.phenopackets.schema.v2.core.IIndividual | null;

          /** Phenopacket phenotypicFeatures */
          phenotypicFeatures?:
            | org.phenopackets.schema.v2.core.IPhenotypicFeature[]
            | null;

          /** Phenopacket measurements */
          measurements?: org.phenopackets.schema.v2.core.IMeasurement[] | null;

          /** Phenopacket biosamples */
          biosamples?: org.phenopackets.schema.v2.core.IBiosample[] | null;

          /** Phenopacket interpretations */
          interpretations?:
            | org.phenopackets.schema.v2.core.IInterpretation[]
            | null;

          /** Phenopacket diseases */
          diseases?: org.phenopackets.schema.v2.core.IDisease[] | null;

          /** Phenopacket medicalActions */
          medicalActions?:
            | org.phenopackets.schema.v2.core.IMedicalAction[]
            | null;

          /** Phenopacket files */
          files?: org.phenopackets.schema.v2.core.IFile[] | null;

          /** Phenopacket metaData */
          metaData?: org.phenopackets.schema.v2.core.IMetaData | null;
        }

        /** Represents a Phenopacket. */
        class Phenopacket implements IPhenopacket {
          /**
           * Constructs a new Phenopacket.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.phenopackets.schema.v2.IPhenopacket);

          /** Phenopacket id. */
          public id: string;

          /** Phenopacket subject. */
          public subject?: org.phenopackets.schema.v2.core.IIndividual | null;

          /** Phenopacket phenotypicFeatures. */
          public phenotypicFeatures: org.phenopackets.schema.v2.core.IPhenotypicFeature[];

          /** Phenopacket measurements. */
          public measurements: org.phenopackets.schema.v2.core.IMeasurement[];

          /** Phenopacket biosamples. */
          public biosamples: org.phenopackets.schema.v2.core.IBiosample[];

          /** Phenopacket interpretations. */
          public interpretations: org.phenopackets.schema.v2.core.IInterpretation[];

          /** Phenopacket diseases. */
          public diseases: org.phenopackets.schema.v2.core.IDisease[];

          /** Phenopacket medicalActions. */
          public medicalActions: org.phenopackets.schema.v2.core.IMedicalAction[];

          /** Phenopacket files. */
          public files: org.phenopackets.schema.v2.core.IFile[];

          /** Phenopacket metaData. */
          public metaData?: org.phenopackets.schema.v2.core.IMetaData | null;

          /**
           * Creates a new Phenopacket instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Phenopacket instance
           */
          public static create(
            properties?: org.phenopackets.schema.v2.IPhenopacket
          ): org.phenopackets.schema.v2.Phenopacket;

          /**
           * Encodes the specified Phenopacket message. Does not implicitly {@link org.phenopackets.schema.v2.Phenopacket.verify|verify} messages.
           * @param message Phenopacket message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.phenopackets.schema.v2.IPhenopacket,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Phenopacket message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.Phenopacket.verify|verify} messages.
           * @param message Phenopacket message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.phenopackets.schema.v2.IPhenopacket,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Phenopacket message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Phenopacket
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.phenopackets.schema.v2.Phenopacket;

          /**
           * Decodes a Phenopacket message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Phenopacket
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.phenopackets.schema.v2.Phenopacket;

          /**
           * Verifies a Phenopacket message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Phenopacket message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Phenopacket
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.phenopackets.schema.v2.Phenopacket;

          /**
           * Creates a plain object from a Phenopacket message. Also converts values to other types if specified.
           * @param message Phenopacket
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.phenopackets.schema.v2.Phenopacket,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Phenopacket to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Phenopacket
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Family. */
        interface IFamily {
          /** Family id */
          id?: string | null;

          /** Family proband */
          proband?: org.phenopackets.schema.v2.IPhenopacket | null;

          /** Family relatives */
          relatives?: org.phenopackets.schema.v2.IPhenopacket[] | null;

          /** Family consanguinousParents */
          consanguinousParents?: boolean | null;

          /** Family pedigree */
          pedigree?: org.phenopackets.schema.v2.core.IPedigree | null;

          /** Family files */
          files?: org.phenopackets.schema.v2.core.IFile[] | null;

          /** Family metaData */
          metaData?: org.phenopackets.schema.v2.core.IMetaData | null;
        }

        /** Represents a Family. */
        class Family implements IFamily {
          /**
           * Constructs a new Family.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.phenopackets.schema.v2.IFamily);

          /** Family id. */
          public id: string;

          /** Family proband. */
          public proband?: org.phenopackets.schema.v2.IPhenopacket | null;

          /** Family relatives. */
          public relatives: org.phenopackets.schema.v2.IPhenopacket[];

          /** Family consanguinousParents. */
          public consanguinousParents: boolean;

          /** Family pedigree. */
          public pedigree?: org.phenopackets.schema.v2.core.IPedigree | null;

          /** Family files. */
          public files: org.phenopackets.schema.v2.core.IFile[];

          /** Family metaData. */
          public metaData?: org.phenopackets.schema.v2.core.IMetaData | null;

          /**
           * Creates a new Family instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Family instance
           */
          public static create(
            properties?: org.phenopackets.schema.v2.IFamily
          ): org.phenopackets.schema.v2.Family;

          /**
           * Encodes the specified Family message. Does not implicitly {@link org.phenopackets.schema.v2.Family.verify|verify} messages.
           * @param message Family message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.phenopackets.schema.v2.IFamily,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Family message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.Family.verify|verify} messages.
           * @param message Family message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.phenopackets.schema.v2.IFamily,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Family message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Family
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.phenopackets.schema.v2.Family;

          /**
           * Decodes a Family message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Family
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.phenopackets.schema.v2.Family;

          /**
           * Verifies a Family message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Family message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Family
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.phenopackets.schema.v2.Family;

          /**
           * Creates a plain object from a Family message. Also converts values to other types if specified.
           * @param message Family
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.phenopackets.schema.v2.Family,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Family to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Family
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Cohort. */
        interface ICohort {
          /** Cohort id */
          id?: string | null;

          /** Cohort description */
          description?: string | null;

          /** Cohort members */
          members?: org.phenopackets.schema.v2.IPhenopacket[] | null;

          /** Cohort files */
          files?: org.phenopackets.schema.v2.core.IFile[] | null;

          /** Cohort metaData */
          metaData?: org.phenopackets.schema.v2.core.IMetaData | null;
        }

        /** Represents a Cohort. */
        class Cohort implements ICohort {
          /**
           * Constructs a new Cohort.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.phenopackets.schema.v2.ICohort);

          /** Cohort id. */
          public id: string;

          /** Cohort description. */
          public description: string;

          /** Cohort members. */
          public members: org.phenopackets.schema.v2.IPhenopacket[];

          /** Cohort files. */
          public files: org.phenopackets.schema.v2.core.IFile[];

          /** Cohort metaData. */
          public metaData?: org.phenopackets.schema.v2.core.IMetaData | null;

          /**
           * Creates a new Cohort instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Cohort instance
           */
          public static create(
            properties?: org.phenopackets.schema.v2.ICohort
          ): org.phenopackets.schema.v2.Cohort;

          /**
           * Encodes the specified Cohort message. Does not implicitly {@link org.phenopackets.schema.v2.Cohort.verify|verify} messages.
           * @param message Cohort message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.phenopackets.schema.v2.ICohort,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Cohort message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.Cohort.verify|verify} messages.
           * @param message Cohort message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.phenopackets.schema.v2.ICohort,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Cohort message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Cohort
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.phenopackets.schema.v2.Cohort;

          /**
           * Decodes a Cohort message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Cohort
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.phenopackets.schema.v2.Cohort;

          /**
           * Verifies a Cohort message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Cohort message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Cohort
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.phenopackets.schema.v2.Cohort;

          /**
           * Creates a plain object from a Cohort message. Also converts values to other types if specified.
           * @param message Cohort
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.phenopackets.schema.v2.Cohort,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Cohort to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Cohort
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Namespace core. */
        namespace core {
          /** Properties of an OntologyClass. */
          interface IOntologyClass {
            /** OntologyClass id */
            id?: string | null;

            /** OntologyClass label */
            label?: string | null;
          }

          /** Represents an OntologyClass. */
          class OntologyClass implements IOntologyClass {
            /**
             * Constructs a new OntologyClass.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IOntologyClass
            );

            /** OntologyClass id. */
            public id: string;

            /** OntologyClass label. */
            public label: string;

            /**
             * Creates a new OntologyClass instance using the specified properties.
             * @param [properties] Properties to set
             * @returns OntologyClass instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IOntologyClass
            ): org.phenopackets.schema.v2.core.OntologyClass;

            /**
             * Encodes the specified OntologyClass message. Does not implicitly {@link org.phenopackets.schema.v2.core.OntologyClass.verify|verify} messages.
             * @param message OntologyClass message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IOntologyClass,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified OntologyClass message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.OntologyClass.verify|verify} messages.
             * @param message OntologyClass message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IOntologyClass,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an OntologyClass message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns OntologyClass
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.OntologyClass;

            /**
             * Decodes an OntologyClass message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns OntologyClass
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.OntologyClass;

            /**
             * Verifies an OntologyClass message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an OntologyClass message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns OntologyClass
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.OntologyClass;

            /**
             * Creates a plain object from an OntologyClass message. Also converts values to other types if specified.
             * @param message OntologyClass
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.OntologyClass,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this OntologyClass to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for OntologyClass
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of an ExternalReference. */
          interface IExternalReference {
            /** ExternalReference id */
            id?: string | null;

            /** ExternalReference reference */
            reference?: string | null;

            /** ExternalReference description */
            description?: string | null;
          }

          /** Represents an ExternalReference. */
          class ExternalReference implements IExternalReference {
            /**
             * Constructs a new ExternalReference.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IExternalReference
            );

            /** ExternalReference id. */
            public id: string;

            /** ExternalReference reference. */
            public reference: string;

            /** ExternalReference description. */
            public description: string;

            /**
             * Creates a new ExternalReference instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ExternalReference instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IExternalReference
            ): org.phenopackets.schema.v2.core.ExternalReference;

            /**
             * Encodes the specified ExternalReference message. Does not implicitly {@link org.phenopackets.schema.v2.core.ExternalReference.verify|verify} messages.
             * @param message ExternalReference message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IExternalReference,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified ExternalReference message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.ExternalReference.verify|verify} messages.
             * @param message ExternalReference message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IExternalReference,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an ExternalReference message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ExternalReference
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.ExternalReference;

            /**
             * Decodes an ExternalReference message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ExternalReference
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.ExternalReference;

            /**
             * Verifies an ExternalReference message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an ExternalReference message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ExternalReference
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.ExternalReference;

            /**
             * Creates a plain object from an ExternalReference message. Also converts values to other types if specified.
             * @param message ExternalReference
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.ExternalReference,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this ExternalReference to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ExternalReference
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of an Evidence. */
          interface IEvidence {
            /** Evidence evidenceCode */
            evidenceCode?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Evidence reference */
            reference?: org.phenopackets.schema.v2.core.IExternalReference | null;
          }

          /** Represents an Evidence. */
          class Evidence implements IEvidence {
            /**
             * Constructs a new Evidence.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IEvidence);

            /** Evidence evidenceCode. */
            public evidenceCode?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Evidence reference. */
            public reference?: org.phenopackets.schema.v2.core.IExternalReference | null;

            /**
             * Creates a new Evidence instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Evidence instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IEvidence
            ): org.phenopackets.schema.v2.core.Evidence;

            /**
             * Encodes the specified Evidence message. Does not implicitly {@link org.phenopackets.schema.v2.core.Evidence.verify|verify} messages.
             * @param message Evidence message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IEvidence,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Evidence message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Evidence.verify|verify} messages.
             * @param message Evidence message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IEvidence,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an Evidence message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Evidence
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Evidence;

            /**
             * Decodes an Evidence message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Evidence
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Evidence;

            /**
             * Verifies an Evidence message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an Evidence message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Evidence
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Evidence;

            /**
             * Creates a plain object from an Evidence message. Also converts values to other types if specified.
             * @param message Evidence
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Evidence,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Evidence to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Evidence
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Procedure. */
          interface IProcedure {
            /** Procedure code */
            code?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Procedure bodySite */
            bodySite?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Procedure performed */
            performed?: org.phenopackets.schema.v2.core.ITimeElement | null;
          }

          /** Represents a Procedure. */
          class Procedure implements IProcedure {
            /**
             * Constructs a new Procedure.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IProcedure
            );

            /** Procedure code. */
            public code?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Procedure bodySite. */
            public bodySite?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Procedure performed. */
            public performed?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /**
             * Creates a new Procedure instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Procedure instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IProcedure
            ): org.phenopackets.schema.v2.core.Procedure;

            /**
             * Encodes the specified Procedure message. Does not implicitly {@link org.phenopackets.schema.v2.core.Procedure.verify|verify} messages.
             * @param message Procedure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IProcedure,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Procedure message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Procedure.verify|verify} messages.
             * @param message Procedure message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IProcedure,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Procedure message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Procedure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Procedure;

            /**
             * Decodes a Procedure message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Procedure
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Procedure;

            /**
             * Verifies a Procedure message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Procedure message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Procedure
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Procedure;

            /**
             * Creates a plain object from a Procedure message. Also converts values to other types if specified.
             * @param message Procedure
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Procedure,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Procedure to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Procedure
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a GestationalAge. */
          interface IGestationalAge {
            /** GestationalAge weeks */
            weeks?: number | null;

            /** GestationalAge days */
            days?: number | null;
          }

          /** Represents a GestationalAge. */
          class GestationalAge implements IGestationalAge {
            /**
             * Constructs a new GestationalAge.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IGestationalAge
            );

            /** GestationalAge weeks. */
            public weeks: number;

            /** GestationalAge days. */
            public days: number;

            /**
             * Creates a new GestationalAge instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GestationalAge instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IGestationalAge
            ): org.phenopackets.schema.v2.core.GestationalAge;

            /**
             * Encodes the specified GestationalAge message. Does not implicitly {@link org.phenopackets.schema.v2.core.GestationalAge.verify|verify} messages.
             * @param message GestationalAge message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IGestationalAge,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified GestationalAge message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.GestationalAge.verify|verify} messages.
             * @param message GestationalAge message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IGestationalAge,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a GestationalAge message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GestationalAge
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.GestationalAge;

            /**
             * Decodes a GestationalAge message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GestationalAge
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.GestationalAge;

            /**
             * Verifies a GestationalAge message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a GestationalAge message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GestationalAge
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.GestationalAge;

            /**
             * Creates a plain object from a GestationalAge message. Also converts values to other types if specified.
             * @param message GestationalAge
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.GestationalAge,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this GestationalAge to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for GestationalAge
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of an Age. */
          interface IAge {
            /** Age iso8601duration */
            iso8601duration?: string | null;
          }

          /** Represents an Age. */
          class Age implements IAge {
            /**
             * Constructs a new Age.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IAge);

            /** Age iso8601duration. */
            public iso8601duration: string;

            /**
             * Creates a new Age instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Age instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IAge
            ): org.phenopackets.schema.v2.core.Age;

            /**
             * Encodes the specified Age message. Does not implicitly {@link org.phenopackets.schema.v2.core.Age.verify|verify} messages.
             * @param message Age message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IAge,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Age message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Age.verify|verify} messages.
             * @param message Age message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IAge,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an Age message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Age
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Age;

            /**
             * Decodes an Age message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Age
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Age;

            /**
             * Verifies an Age message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an Age message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Age
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Age;

            /**
             * Creates a plain object from an Age message. Also converts values to other types if specified.
             * @param message Age
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Age,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Age to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Age
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of an AgeRange. */
          interface IAgeRange {
            /** AgeRange start */
            start?: org.phenopackets.schema.v2.core.IAge | null;

            /** AgeRange end */
            end?: org.phenopackets.schema.v2.core.IAge | null;
          }

          /** Represents an AgeRange. */
          class AgeRange implements IAgeRange {
            /**
             * Constructs a new AgeRange.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IAgeRange);

            /** AgeRange start. */
            public start?: org.phenopackets.schema.v2.core.IAge | null;

            /** AgeRange end. */
            public end?: org.phenopackets.schema.v2.core.IAge | null;

            /**
             * Creates a new AgeRange instance using the specified properties.
             * @param [properties] Properties to set
             * @returns AgeRange instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IAgeRange
            ): org.phenopackets.schema.v2.core.AgeRange;

            /**
             * Encodes the specified AgeRange message. Does not implicitly {@link org.phenopackets.schema.v2.core.AgeRange.verify|verify} messages.
             * @param message AgeRange message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IAgeRange,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified AgeRange message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.AgeRange.verify|verify} messages.
             * @param message AgeRange message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IAgeRange,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an AgeRange message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns AgeRange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.AgeRange;

            /**
             * Decodes an AgeRange message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns AgeRange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.AgeRange;

            /**
             * Verifies an AgeRange message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an AgeRange message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns AgeRange
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.AgeRange;

            /**
             * Creates a plain object from an AgeRange message. Also converts values to other types if specified.
             * @param message AgeRange
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.AgeRange,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this AgeRange to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for AgeRange
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a TimeInterval. */
          interface ITimeInterval {
            /** TimeInterval start */
            start?: google.protobuf.ITimestamp | null;

            /** TimeInterval end */
            end?: google.protobuf.ITimestamp | null;
          }

          /** Represents a TimeInterval. */
          class TimeInterval implements ITimeInterval {
            /**
             * Constructs a new TimeInterval.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.ITimeInterval
            );

            /** TimeInterval start. */
            public start?: google.protobuf.ITimestamp | null;

            /** TimeInterval end. */
            public end?: google.protobuf.ITimestamp | null;

            /**
             * Creates a new TimeInterval instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TimeInterval instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.ITimeInterval
            ): org.phenopackets.schema.v2.core.TimeInterval;

            /**
             * Encodes the specified TimeInterval message. Does not implicitly {@link org.phenopackets.schema.v2.core.TimeInterval.verify|verify} messages.
             * @param message TimeInterval message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.ITimeInterval,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified TimeInterval message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.TimeInterval.verify|verify} messages.
             * @param message TimeInterval message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.ITimeInterval,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a TimeInterval message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TimeInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.TimeInterval;

            /**
             * Decodes a TimeInterval message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TimeInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.TimeInterval;

            /**
             * Verifies a TimeInterval message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a TimeInterval message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TimeInterval
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.TimeInterval;

            /**
             * Creates a plain object from a TimeInterval message. Also converts values to other types if specified.
             * @param message TimeInterval
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.TimeInterval,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this TimeInterval to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TimeInterval
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a TimeElement. */
          interface ITimeElement {
            /** TimeElement gestationalAge */
            gestationalAge?: org.phenopackets.schema.v2.core.IGestationalAge | null;

            /** TimeElement age */
            age?: org.phenopackets.schema.v2.core.IAge | null;

            /** TimeElement ageRange */
            ageRange?: org.phenopackets.schema.v2.core.IAgeRange | null;

            /** TimeElement ontologyClass */
            ontologyClass?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** TimeElement timestamp */
            timestamp?: google.protobuf.ITimestamp | null;

            /** TimeElement interval */
            interval?: org.phenopackets.schema.v2.core.ITimeInterval | null;
          }

          /** Represents a TimeElement. */
          class TimeElement implements ITimeElement {
            /**
             * Constructs a new TimeElement.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.ITimeElement
            );

            /** TimeElement gestationalAge. */
            public gestationalAge?: org.phenopackets.schema.v2.core.IGestationalAge | null;

            /** TimeElement age. */
            public age?: org.phenopackets.schema.v2.core.IAge | null;

            /** TimeElement ageRange. */
            public ageRange?: org.phenopackets.schema.v2.core.IAgeRange | null;

            /** TimeElement ontologyClass. */
            public ontologyClass?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** TimeElement timestamp. */
            public timestamp?: google.protobuf.ITimestamp | null;

            /** TimeElement interval. */
            public interval?: org.phenopackets.schema.v2.core.ITimeInterval | null;

            /** TimeElement element. */
            public element?:
              | "gestationalAge"
              | "age"
              | "ageRange"
              | "ontologyClass"
              | "timestamp"
              | "interval";

            /**
             * Creates a new TimeElement instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TimeElement instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.ITimeElement
            ): org.phenopackets.schema.v2.core.TimeElement;

            /**
             * Encodes the specified TimeElement message. Does not implicitly {@link org.phenopackets.schema.v2.core.TimeElement.verify|verify} messages.
             * @param message TimeElement message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.ITimeElement,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified TimeElement message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.TimeElement.verify|verify} messages.
             * @param message TimeElement message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.ITimeElement,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a TimeElement message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TimeElement
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.TimeElement;

            /**
             * Decodes a TimeElement message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TimeElement
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.TimeElement;

            /**
             * Verifies a TimeElement message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a TimeElement message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TimeElement
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.TimeElement;

            /**
             * Creates a plain object from a TimeElement message. Also converts values to other types if specified.
             * @param message TimeElement
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.TimeElement,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this TimeElement to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TimeElement
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a File. */
          interface IFile {
            /** File uri */
            uri?: string | null;

            /** File individualToFileIdentifiers */
            individualToFileIdentifiers?: { [k: string]: string } | null;

            /** File fileAttributes */
            fileAttributes?: { [k: string]: string } | null;
          }

          /** Represents a File. */
          class File implements IFile {
            /**
             * Constructs a new File.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IFile);

            /** File uri. */
            public uri: string;

            /** File individualToFileIdentifiers. */
            public individualToFileIdentifiers: { [k: string]: string };

            /** File fileAttributes. */
            public fileAttributes: { [k: string]: string };

            /**
             * Creates a new File instance using the specified properties.
             * @param [properties] Properties to set
             * @returns File instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IFile
            ): org.phenopackets.schema.v2.core.File;

            /**
             * Encodes the specified File message. Does not implicitly {@link org.phenopackets.schema.v2.core.File.verify|verify} messages.
             * @param message File message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IFile,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified File message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.File.verify|verify} messages.
             * @param message File message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IFile,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a File message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns File
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.File;

            /**
             * Decodes a File message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns File
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.File;

            /**
             * Verifies a File message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a File message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns File
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.File;

            /**
             * Creates a plain object from a File message. Also converts values to other types if specified.
             * @param message File
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.File,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this File to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for File
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Biosample. */
          interface IBiosample {
            /** Biosample id */
            id?: string | null;

            /** Biosample individualId */
            individualId?: string | null;

            /** Biosample derivedFromId */
            derivedFromId?: string | null;

            /** Biosample description */
            description?: string | null;

            /** Biosample sampledTissue */
            sampledTissue?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample sampleType */
            sampleType?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample phenotypicFeatures */
            phenotypicFeatures?:
              | org.phenopackets.schema.v2.core.IPhenotypicFeature[]
              | null;

            /** Biosample measurements */
            measurements?:
              | org.phenopackets.schema.v2.core.IMeasurement[]
              | null;

            /** Biosample taxonomy */
            taxonomy?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample timeOfCollection */
            timeOfCollection?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Biosample histologicalDiagnosis */
            histologicalDiagnosis?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample tumorProgression */
            tumorProgression?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample tumorGrade */
            tumorGrade?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample pathologicalStage */
            pathologicalStage?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample pathologicalTnmFinding */
            pathologicalTnmFinding?:
              | org.phenopackets.schema.v2.core.IOntologyClass[]
              | null;

            /** Biosample diagnosticMarkers */
            diagnosticMarkers?:
              | org.phenopackets.schema.v2.core.IOntologyClass[]
              | null;

            /** Biosample procedure */
            procedure?: org.phenopackets.schema.v2.core.IProcedure | null;

            /** Biosample files */
            files?: org.phenopackets.schema.v2.core.IFile[] | null;

            /** Biosample materialSample */
            materialSample?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample sampleProcessing */
            sampleProcessing?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample sampleStorage */
            sampleStorage?: org.phenopackets.schema.v2.core.IOntologyClass | null;
          }

          /** Represents a Biosample. */
          class Biosample implements IBiosample {
            /**
             * Constructs a new Biosample.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IBiosample
            );

            /** Biosample id. */
            public id: string;

            /** Biosample individualId. */
            public individualId: string;

            /** Biosample derivedFromId. */
            public derivedFromId: string;

            /** Biosample description. */
            public description: string;

            /** Biosample sampledTissue. */
            public sampledTissue?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample sampleType. */
            public sampleType?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample phenotypicFeatures. */
            public phenotypicFeatures: org.phenopackets.schema.v2.core.IPhenotypicFeature[];

            /** Biosample measurements. */
            public measurements: org.phenopackets.schema.v2.core.IMeasurement[];

            /** Biosample taxonomy. */
            public taxonomy?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample timeOfCollection. */
            public timeOfCollection?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Biosample histologicalDiagnosis. */
            public histologicalDiagnosis?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample tumorProgression. */
            public tumorProgression?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample tumorGrade. */
            public tumorGrade?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample pathologicalStage. */
            public pathologicalStage?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample pathologicalTnmFinding. */
            public pathologicalTnmFinding: org.phenopackets.schema.v2.core.IOntologyClass[];

            /** Biosample diagnosticMarkers. */
            public diagnosticMarkers: org.phenopackets.schema.v2.core.IOntologyClass[];

            /** Biosample procedure. */
            public procedure?: org.phenopackets.schema.v2.core.IProcedure | null;

            /** Biosample files. */
            public files: org.phenopackets.schema.v2.core.IFile[];

            /** Biosample materialSample. */
            public materialSample?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample sampleProcessing. */
            public sampleProcessing?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Biosample sampleStorage. */
            public sampleStorage?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /**
             * Creates a new Biosample instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Biosample instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IBiosample
            ): org.phenopackets.schema.v2.core.Biosample;

            /**
             * Encodes the specified Biosample message. Does not implicitly {@link org.phenopackets.schema.v2.core.Biosample.verify|verify} messages.
             * @param message Biosample message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IBiosample,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Biosample message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Biosample.verify|verify} messages.
             * @param message Biosample message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IBiosample,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Biosample message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Biosample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Biosample;

            /**
             * Decodes a Biosample message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Biosample
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Biosample;

            /**
             * Verifies a Biosample message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Biosample message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Biosample
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Biosample;

            /**
             * Creates a plain object from a Biosample message. Also converts values to other types if specified.
             * @param message Biosample
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Biosample,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Biosample to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Biosample
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Measurement. */
          interface IMeasurement {
            /** Measurement description */
            description?: string | null;

            /** Measurement assay */
            assay?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Measurement value */
            value?: org.phenopackets.schema.v2.core.IValue | null;

            /** Measurement complexValue */
            complexValue?: org.phenopackets.schema.v2.core.IComplexValue | null;

            /** Measurement timeObserved */
            timeObserved?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Measurement procedure */
            procedure?: org.phenopackets.schema.v2.core.IProcedure | null;
          }

          /** Represents a Measurement. */
          class Measurement implements IMeasurement {
            /**
             * Constructs a new Measurement.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IMeasurement
            );

            /** Measurement description. */
            public description: string;

            /** Measurement assay. */
            public assay?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Measurement value. */
            public value?: org.phenopackets.schema.v2.core.IValue | null;

            /** Measurement complexValue. */
            public complexValue?: org.phenopackets.schema.v2.core.IComplexValue | null;

            /** Measurement timeObserved. */
            public timeObserved?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Measurement procedure. */
            public procedure?: org.phenopackets.schema.v2.core.IProcedure | null;

            /** Measurement measurementValue. */
            public measurementValue?: "value" | "complexValue";

            /**
             * Creates a new Measurement instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Measurement instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IMeasurement
            ): org.phenopackets.schema.v2.core.Measurement;

            /**
             * Encodes the specified Measurement message. Does not implicitly {@link org.phenopackets.schema.v2.core.Measurement.verify|verify} messages.
             * @param message Measurement message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IMeasurement,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Measurement message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Measurement.verify|verify} messages.
             * @param message Measurement message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IMeasurement,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Measurement message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Measurement
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Measurement;

            /**
             * Decodes a Measurement message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Measurement
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Measurement;

            /**
             * Verifies a Measurement message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Measurement message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Measurement
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Measurement;

            /**
             * Creates a plain object from a Measurement message. Also converts values to other types if specified.
             * @param message Measurement
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Measurement,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Measurement to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Measurement
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Value. */
          interface IValue {
            /** Value quantity */
            quantity?: org.phenopackets.schema.v2.core.IQuantity | null;

            /** Value ontologyClass */
            ontologyClass?: org.phenopackets.schema.v2.core.IOntologyClass | null;
          }

          /** Represents a Value. */
          class Value implements IValue {
            /**
             * Constructs a new Value.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IValue);

            /** Value quantity. */
            public quantity?: org.phenopackets.schema.v2.core.IQuantity | null;

            /** Value ontologyClass. */
            public ontologyClass?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Value value. */
            public value?: "quantity" | "ontologyClass";

            /**
             * Creates a new Value instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Value instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IValue
            ): org.phenopackets.schema.v2.core.Value;

            /**
             * Encodes the specified Value message. Does not implicitly {@link org.phenopackets.schema.v2.core.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IValue,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Value message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Value.verify|verify} messages.
             * @param message Value message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IValue,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Value message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Value;

            /**
             * Decodes a Value message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Value
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Value;

            /**
             * Verifies a Value message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Value message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Value
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Value;

            /**
             * Creates a plain object from a Value message. Also converts values to other types if specified.
             * @param message Value
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Value,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Value to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Value
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a ComplexValue. */
          interface IComplexValue {
            /** ComplexValue typedQuantities */
            typedQuantities?:
              | org.phenopackets.schema.v2.core.ITypedQuantity[]
              | null;
          }

          /** Represents a ComplexValue. */
          class ComplexValue implements IComplexValue {
            /**
             * Constructs a new ComplexValue.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IComplexValue
            );

            /** ComplexValue typedQuantities. */
            public typedQuantities: org.phenopackets.schema.v2.core.ITypedQuantity[];

            /**
             * Creates a new ComplexValue instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ComplexValue instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IComplexValue
            ): org.phenopackets.schema.v2.core.ComplexValue;

            /**
             * Encodes the specified ComplexValue message. Does not implicitly {@link org.phenopackets.schema.v2.core.ComplexValue.verify|verify} messages.
             * @param message ComplexValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IComplexValue,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified ComplexValue message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.ComplexValue.verify|verify} messages.
             * @param message ComplexValue message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IComplexValue,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a ComplexValue message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ComplexValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.ComplexValue;

            /**
             * Decodes a ComplexValue message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ComplexValue
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.ComplexValue;

            /**
             * Verifies a ComplexValue message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a ComplexValue message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ComplexValue
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.ComplexValue;

            /**
             * Creates a plain object from a ComplexValue message. Also converts values to other types if specified.
             * @param message ComplexValue
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.ComplexValue,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this ComplexValue to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ComplexValue
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Quantity. */
          interface IQuantity {
            /** Quantity unit */
            unit?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Quantity value */
            value?: number | null;

            /** Quantity referenceRange */
            referenceRange?: org.phenopackets.schema.v2.core.IReferenceRange | null;
          }

          /** Represents a Quantity. */
          class Quantity implements IQuantity {
            /**
             * Constructs a new Quantity.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IQuantity);

            /** Quantity unit. */
            public unit?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Quantity value. */
            public value: number;

            /** Quantity referenceRange. */
            public referenceRange?: org.phenopackets.schema.v2.core.IReferenceRange | null;

            /**
             * Creates a new Quantity instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Quantity instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IQuantity
            ): org.phenopackets.schema.v2.core.Quantity;

            /**
             * Encodes the specified Quantity message. Does not implicitly {@link org.phenopackets.schema.v2.core.Quantity.verify|verify} messages.
             * @param message Quantity message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IQuantity,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Quantity message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Quantity.verify|verify} messages.
             * @param message Quantity message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IQuantity,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Quantity message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Quantity
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Quantity;

            /**
             * Decodes a Quantity message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Quantity
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Quantity;

            /**
             * Verifies a Quantity message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Quantity message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Quantity
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Quantity;

            /**
             * Creates a plain object from a Quantity message. Also converts values to other types if specified.
             * @param message Quantity
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Quantity,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Quantity to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Quantity
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a TypedQuantity. */
          interface ITypedQuantity {
            /** TypedQuantity type */
            type?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** TypedQuantity quantity */
            quantity?: org.phenopackets.schema.v2.core.IQuantity | null;
          }

          /** Represents a TypedQuantity. */
          class TypedQuantity implements ITypedQuantity {
            /**
             * Constructs a new TypedQuantity.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.ITypedQuantity
            );

            /** TypedQuantity type. */
            public type?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** TypedQuantity quantity. */
            public quantity?: org.phenopackets.schema.v2.core.IQuantity | null;

            /**
             * Creates a new TypedQuantity instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TypedQuantity instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.ITypedQuantity
            ): org.phenopackets.schema.v2.core.TypedQuantity;

            /**
             * Encodes the specified TypedQuantity message. Does not implicitly {@link org.phenopackets.schema.v2.core.TypedQuantity.verify|verify} messages.
             * @param message TypedQuantity message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.ITypedQuantity,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified TypedQuantity message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.TypedQuantity.verify|verify} messages.
             * @param message TypedQuantity message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.ITypedQuantity,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a TypedQuantity message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TypedQuantity
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.TypedQuantity;

            /**
             * Decodes a TypedQuantity message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TypedQuantity
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.TypedQuantity;

            /**
             * Verifies a TypedQuantity message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a TypedQuantity message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TypedQuantity
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.TypedQuantity;

            /**
             * Creates a plain object from a TypedQuantity message. Also converts values to other types if specified.
             * @param message TypedQuantity
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.TypedQuantity,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this TypedQuantity to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TypedQuantity
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a ReferenceRange. */
          interface IReferenceRange {
            /** ReferenceRange unit */
            unit?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** ReferenceRange low */
            low?: number | null;

            /** ReferenceRange high */
            high?: number | null;
          }

          /** Represents a ReferenceRange. */
          class ReferenceRange implements IReferenceRange {
            /**
             * Constructs a new ReferenceRange.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IReferenceRange
            );

            /** ReferenceRange unit. */
            public unit?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** ReferenceRange low. */
            public low: number;

            /** ReferenceRange high. */
            public high: number;

            /**
             * Creates a new ReferenceRange instance using the specified properties.
             * @param [properties] Properties to set
             * @returns ReferenceRange instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IReferenceRange
            ): org.phenopackets.schema.v2.core.ReferenceRange;

            /**
             * Encodes the specified ReferenceRange message. Does not implicitly {@link org.phenopackets.schema.v2.core.ReferenceRange.verify|verify} messages.
             * @param message ReferenceRange message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IReferenceRange,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified ReferenceRange message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.ReferenceRange.verify|verify} messages.
             * @param message ReferenceRange message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IReferenceRange,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a ReferenceRange message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns ReferenceRange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.ReferenceRange;

            /**
             * Decodes a ReferenceRange message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns ReferenceRange
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.ReferenceRange;

            /**
             * Verifies a ReferenceRange message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a ReferenceRange message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns ReferenceRange
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.ReferenceRange;

            /**
             * Creates a plain object from a ReferenceRange message. Also converts values to other types if specified.
             * @param message ReferenceRange
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.ReferenceRange,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this ReferenceRange to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for ReferenceRange
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a PhenotypicFeature. */
          interface IPhenotypicFeature {
            /** PhenotypicFeature description */
            description?: string | null;

            /** PhenotypicFeature type */
            type?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** PhenotypicFeature excluded */
            excluded?: boolean | null;

            /** PhenotypicFeature severity */
            severity?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** PhenotypicFeature modifiers */
            modifiers?: org.phenopackets.schema.v2.core.IOntologyClass[] | null;

            /** PhenotypicFeature onset */
            onset?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** PhenotypicFeature resolution */
            resolution?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** PhenotypicFeature evidence */
            evidence?: org.phenopackets.schema.v2.core.IEvidence[] | null;
          }

          /** Represents a PhenotypicFeature. */
          class PhenotypicFeature implements IPhenotypicFeature {
            /**
             * Constructs a new PhenotypicFeature.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IPhenotypicFeature
            );

            /** PhenotypicFeature description. */
            public description: string;

            /** PhenotypicFeature type. */
            public type?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** PhenotypicFeature excluded. */
            public excluded: boolean;

            /** PhenotypicFeature severity. */
            public severity?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** PhenotypicFeature modifiers. */
            public modifiers: org.phenopackets.schema.v2.core.IOntologyClass[];

            /** PhenotypicFeature onset. */
            public onset?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** PhenotypicFeature resolution. */
            public resolution?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** PhenotypicFeature evidence. */
            public evidence: org.phenopackets.schema.v2.core.IEvidence[];

            /**
             * Creates a new PhenotypicFeature instance using the specified properties.
             * @param [properties] Properties to set
             * @returns PhenotypicFeature instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IPhenotypicFeature
            ): org.phenopackets.schema.v2.core.PhenotypicFeature;

            /**
             * Encodes the specified PhenotypicFeature message. Does not implicitly {@link org.phenopackets.schema.v2.core.PhenotypicFeature.verify|verify} messages.
             * @param message PhenotypicFeature message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IPhenotypicFeature,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified PhenotypicFeature message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.PhenotypicFeature.verify|verify} messages.
             * @param message PhenotypicFeature message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IPhenotypicFeature,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a PhenotypicFeature message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns PhenotypicFeature
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.PhenotypicFeature;

            /**
             * Decodes a PhenotypicFeature message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns PhenotypicFeature
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.PhenotypicFeature;

            /**
             * Verifies a PhenotypicFeature message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a PhenotypicFeature message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns PhenotypicFeature
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.PhenotypicFeature;

            /**
             * Creates a plain object from a PhenotypicFeature message. Also converts values to other types if specified.
             * @param message PhenotypicFeature
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.PhenotypicFeature,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this PhenotypicFeature to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for PhenotypicFeature
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Disease. */
          interface IDisease {
            /** Disease term */
            term?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Disease excluded */
            excluded?: boolean | null;

            /** Disease onset */
            onset?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Disease resolution */
            resolution?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Disease diseaseStage */
            diseaseStage?:
              | org.phenopackets.schema.v2.core.IOntologyClass[]
              | null;

            /** Disease clinicalTnmFinding */
            clinicalTnmFinding?:
              | org.phenopackets.schema.v2.core.IOntologyClass[]
              | null;

            /** Disease primarySite */
            primarySite?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Disease laterality */
            laterality?: org.phenopackets.schema.v2.core.IOntologyClass | null;
          }

          /** Represents a Disease. */
          class Disease implements IDisease {
            /**
             * Constructs a new Disease.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IDisease);

            /** Disease term. */
            public term?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Disease excluded. */
            public excluded: boolean;

            /** Disease onset. */
            public onset?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Disease resolution. */
            public resolution?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Disease diseaseStage. */
            public diseaseStage: org.phenopackets.schema.v2.core.IOntologyClass[];

            /** Disease clinicalTnmFinding. */
            public clinicalTnmFinding: org.phenopackets.schema.v2.core.IOntologyClass[];

            /** Disease primarySite. */
            public primarySite?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Disease laterality. */
            public laterality?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /**
             * Creates a new Disease instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Disease instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IDisease
            ): org.phenopackets.schema.v2.core.Disease;

            /**
             * Encodes the specified Disease message. Does not implicitly {@link org.phenopackets.schema.v2.core.Disease.verify|verify} messages.
             * @param message Disease message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IDisease,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Disease message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Disease.verify|verify} messages.
             * @param message Disease message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IDisease,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Disease message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Disease
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Disease;

            /**
             * Decodes a Disease message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Disease
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Disease;

            /**
             * Verifies a Disease message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Disease message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Disease
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Disease;

            /**
             * Creates a plain object from a Disease message. Also converts values to other types if specified.
             * @param message Disease
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Disease,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Disease to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Disease
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of an Interpretation. */
          interface IInterpretation {
            /** Interpretation id */
            id?: string | null;

            /** Interpretation progressStatus */
            progressStatus?: org.phenopackets.schema.v2.core.Interpretation.ProgressStatus | null;

            /** Interpretation diagnosis */
            diagnosis?: org.phenopackets.schema.v2.core.IDiagnosis | null;

            /** Interpretation summary */
            summary?: string | null;
          }

          /** Represents an Interpretation. */
          class Interpretation implements IInterpretation {
            /**
             * Constructs a new Interpretation.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IInterpretation
            );

            /** Interpretation id. */
            public id: string;

            /** Interpretation progressStatus. */
            public progressStatus: org.phenopackets.schema.v2.core.Interpretation.ProgressStatus;

            /** Interpretation diagnosis. */
            public diagnosis?: org.phenopackets.schema.v2.core.IDiagnosis | null;

            /** Interpretation summary. */
            public summary: string;

            /**
             * Creates a new Interpretation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Interpretation instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IInterpretation
            ): org.phenopackets.schema.v2.core.Interpretation;

            /**
             * Encodes the specified Interpretation message. Does not implicitly {@link org.phenopackets.schema.v2.core.Interpretation.verify|verify} messages.
             * @param message Interpretation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IInterpretation,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Interpretation message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Interpretation.verify|verify} messages.
             * @param message Interpretation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IInterpretation,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an Interpretation message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Interpretation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Interpretation;

            /**
             * Decodes an Interpretation message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Interpretation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Interpretation;

            /**
             * Verifies an Interpretation message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an Interpretation message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Interpretation
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Interpretation;

            /**
             * Creates a plain object from an Interpretation message. Also converts values to other types if specified.
             * @param message Interpretation
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Interpretation,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Interpretation to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Interpretation
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          namespace Interpretation {
            /** ProgressStatus enum. */
            enum ProgressStatus {
              UNKNOWN_PROGRESS = 0,
              IN_PROGRESS = 1,
              COMPLETED = 2,
              SOLVED = 3,
              UNSOLVED = 4,
            }
          }

          /** Properties of a Diagnosis. */
          interface IDiagnosis {
            /** Diagnosis disease */
            disease?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Diagnosis genomicInterpretations */
            genomicInterpretations?:
              | org.phenopackets.schema.v2.core.IGenomicInterpretation[]
              | null;
          }

          /** Represents a Diagnosis. */
          class Diagnosis implements IDiagnosis {
            /**
             * Constructs a new Diagnosis.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IDiagnosis
            );

            /** Diagnosis disease. */
            public disease?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Diagnosis genomicInterpretations. */
            public genomicInterpretations: org.phenopackets.schema.v2.core.IGenomicInterpretation[];

            /**
             * Creates a new Diagnosis instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Diagnosis instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IDiagnosis
            ): org.phenopackets.schema.v2.core.Diagnosis;

            /**
             * Encodes the specified Diagnosis message. Does not implicitly {@link org.phenopackets.schema.v2.core.Diagnosis.verify|verify} messages.
             * @param message Diagnosis message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IDiagnosis,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Diagnosis message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Diagnosis.verify|verify} messages.
             * @param message Diagnosis message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IDiagnosis,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Diagnosis message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Diagnosis
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Diagnosis;

            /**
             * Decodes a Diagnosis message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Diagnosis
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Diagnosis;

            /**
             * Verifies a Diagnosis message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Diagnosis message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Diagnosis
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Diagnosis;

            /**
             * Creates a plain object from a Diagnosis message. Also converts values to other types if specified.
             * @param message Diagnosis
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Diagnosis,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Diagnosis to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Diagnosis
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a GenomicInterpretation. */
          interface IGenomicInterpretation {
            /** GenomicInterpretation subjectOrBiosampleId */
            subjectOrBiosampleId?: string | null;

            /** GenomicInterpretation interpretationStatus */
            interpretationStatus?: org.phenopackets.schema.v2.core.GenomicInterpretation.InterpretationStatus | null;

            /** GenomicInterpretation gene */
            gene?: org.ga4gh.vrsatile.v1.IGeneDescriptor | null;

            /** GenomicInterpretation variantInterpretation */
            variantInterpretation?: org.phenopackets.schema.v2.core.IVariantInterpretation | null;
          }

          /** Represents a GenomicInterpretation. */
          class GenomicInterpretation implements IGenomicInterpretation {
            /**
             * Constructs a new GenomicInterpretation.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IGenomicInterpretation
            );

            /** GenomicInterpretation subjectOrBiosampleId. */
            public subjectOrBiosampleId: string;

            /** GenomicInterpretation interpretationStatus. */
            public interpretationStatus: org.phenopackets.schema.v2.core.GenomicInterpretation.InterpretationStatus;

            /** GenomicInterpretation gene. */
            public gene?: org.ga4gh.vrsatile.v1.IGeneDescriptor | null;

            /** GenomicInterpretation variantInterpretation. */
            public variantInterpretation?: org.phenopackets.schema.v2.core.IVariantInterpretation | null;

            /** GenomicInterpretation call. */
            public call?: "gene" | "variantInterpretation";

            /**
             * Creates a new GenomicInterpretation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns GenomicInterpretation instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IGenomicInterpretation
            ): org.phenopackets.schema.v2.core.GenomicInterpretation;

            /**
             * Encodes the specified GenomicInterpretation message. Does not implicitly {@link org.phenopackets.schema.v2.core.GenomicInterpretation.verify|verify} messages.
             * @param message GenomicInterpretation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IGenomicInterpretation,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified GenomicInterpretation message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.GenomicInterpretation.verify|verify} messages.
             * @param message GenomicInterpretation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IGenomicInterpretation,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a GenomicInterpretation message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns GenomicInterpretation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.GenomicInterpretation;

            /**
             * Decodes a GenomicInterpretation message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns GenomicInterpretation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.GenomicInterpretation;

            /**
             * Verifies a GenomicInterpretation message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a GenomicInterpretation message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns GenomicInterpretation
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.GenomicInterpretation;

            /**
             * Creates a plain object from a GenomicInterpretation message. Also converts values to other types if specified.
             * @param message GenomicInterpretation
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.GenomicInterpretation,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this GenomicInterpretation to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for GenomicInterpretation
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          namespace GenomicInterpretation {
            /** InterpretationStatus enum. */
            enum InterpretationStatus {
              UNKNOWN_STATUS = 0,
              REJECTED = 1,
              CANDIDATE = 2,
              CONTRIBUTORY = 3,
              CAUSATIVE = 4,
            }
          }

          /** AcmgPathogenicityClassification enum. */
          enum AcmgPathogenicityClassification {
            NOT_PROVIDED = 0,
            BENIGN = 1,
            LIKELY_BENIGN = 2,
            UNCERTAIN_SIGNIFICANCE = 3,
            LIKELY_PATHOGENIC = 4,
            PATHOGENIC = 5,
          }

          /** TherapeuticActionability enum. */
          enum TherapeuticActionability {
            UNKNOWN_ACTIONABILITY = 0,
            NOT_ACTIONABLE = 1,
            ACTIONABLE = 2,
          }

          /** Properties of a VariantInterpretation. */
          interface IVariantInterpretation {
            /** VariantInterpretation acmgPathogenicityClassification */
            acmgPathogenicityClassification?: org.phenopackets.schema.v2.core.AcmgPathogenicityClassification | null;

            /** VariantInterpretation therapeuticActionability */
            therapeuticActionability?: org.phenopackets.schema.v2.core.TherapeuticActionability | null;

            /** VariantInterpretation variationDescriptor */
            variationDescriptor?: org.ga4gh.vrsatile.v1.IVariationDescriptor | null;
          }

          /** Represents a VariantInterpretation. */
          class VariantInterpretation implements IVariantInterpretation {
            /**
             * Constructs a new VariantInterpretation.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IVariantInterpretation
            );

            /** VariantInterpretation acmgPathogenicityClassification. */
            public acmgPathogenicityClassification: org.phenopackets.schema.v2.core.AcmgPathogenicityClassification;

            /** VariantInterpretation therapeuticActionability. */
            public therapeuticActionability: org.phenopackets.schema.v2.core.TherapeuticActionability;

            /** VariantInterpretation variationDescriptor. */
            public variationDescriptor?: org.ga4gh.vrsatile.v1.IVariationDescriptor | null;

            /**
             * Creates a new VariantInterpretation instance using the specified properties.
             * @param [properties] Properties to set
             * @returns VariantInterpretation instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IVariantInterpretation
            ): org.phenopackets.schema.v2.core.VariantInterpretation;

            /**
             * Encodes the specified VariantInterpretation message. Does not implicitly {@link org.phenopackets.schema.v2.core.VariantInterpretation.verify|verify} messages.
             * @param message VariantInterpretation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IVariantInterpretation,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified VariantInterpretation message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.VariantInterpretation.verify|verify} messages.
             * @param message VariantInterpretation message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IVariantInterpretation,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a VariantInterpretation message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns VariantInterpretation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.VariantInterpretation;

            /**
             * Decodes a VariantInterpretation message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns VariantInterpretation
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.VariantInterpretation;

            /**
             * Verifies a VariantInterpretation message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a VariantInterpretation message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns VariantInterpretation
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.VariantInterpretation;

            /**
             * Creates a plain object from a VariantInterpretation message. Also converts values to other types if specified.
             * @param message VariantInterpretation
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.VariantInterpretation,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this VariantInterpretation to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for VariantInterpretation
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of an Individual. */
          interface IIndividual {
            /** Individual id */
            id?: string | null;

            /** Individual alternateIds */
            alternateIds?: string[] | null;

            /** Individual dateOfBirth */
            dateOfBirth?: google.protobuf.ITimestamp | null;

            /** Individual timeAtLastEncounter */
            timeAtLastEncounter?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Individual vitalStatus */
            vitalStatus?: org.phenopackets.schema.v2.core.IVitalStatus | null;

            /** Individual sex */
            sex?: org.phenopackets.schema.v2.core.Sex | null;

            /** Individual karyotypicSex */
            karyotypicSex?: org.phenopackets.schema.v2.core.KaryotypicSex | null;

            /** Individual gender */
            gender?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Individual taxonomy */
            taxonomy?: org.phenopackets.schema.v2.core.IOntologyClass | null;
          }

          /** Represents an Individual. */
          class Individual implements IIndividual {
            /**
             * Constructs a new Individual.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IIndividual
            );

            /** Individual id. */
            public id: string;

            /** Individual alternateIds. */
            public alternateIds: string[];

            /** Individual dateOfBirth. */
            public dateOfBirth?: google.protobuf.ITimestamp | null;

            /** Individual timeAtLastEncounter. */
            public timeAtLastEncounter?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** Individual vitalStatus. */
            public vitalStatus?: org.phenopackets.schema.v2.core.IVitalStatus | null;

            /** Individual sex. */
            public sex: org.phenopackets.schema.v2.core.Sex;

            /** Individual karyotypicSex. */
            public karyotypicSex: org.phenopackets.schema.v2.core.KaryotypicSex;

            /** Individual gender. */
            public gender?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Individual taxonomy. */
            public taxonomy?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /**
             * Creates a new Individual instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Individual instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IIndividual
            ): org.phenopackets.schema.v2.core.Individual;

            /**
             * Encodes the specified Individual message. Does not implicitly {@link org.phenopackets.schema.v2.core.Individual.verify|verify} messages.
             * @param message Individual message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IIndividual,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Individual message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Individual.verify|verify} messages.
             * @param message Individual message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IIndividual,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an Individual message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Individual
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Individual;

            /**
             * Decodes an Individual message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Individual
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Individual;

            /**
             * Verifies an Individual message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an Individual message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Individual
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Individual;

            /**
             * Creates a plain object from an Individual message. Also converts values to other types if specified.
             * @param message Individual
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Individual,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Individual to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Individual
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a VitalStatus. */
          interface IVitalStatus {
            /** VitalStatus status */
            status?: org.phenopackets.schema.v2.core.VitalStatus.Status | null;

            /** VitalStatus timeOfDeath */
            timeOfDeath?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** VitalStatus causeOfDeath */
            causeOfDeath?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** VitalStatus survivalTimeInDays */
            survivalTimeInDays?: number | null;
          }

          /** Represents a VitalStatus. */
          class VitalStatus implements IVitalStatus {
            /**
             * Constructs a new VitalStatus.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IVitalStatus
            );

            /** VitalStatus status. */
            public status: org.phenopackets.schema.v2.core.VitalStatus.Status;

            /** VitalStatus timeOfDeath. */
            public timeOfDeath?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** VitalStatus causeOfDeath. */
            public causeOfDeath?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** VitalStatus survivalTimeInDays. */
            public survivalTimeInDays: number;

            /**
             * Creates a new VitalStatus instance using the specified properties.
             * @param [properties] Properties to set
             * @returns VitalStatus instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IVitalStatus
            ): org.phenopackets.schema.v2.core.VitalStatus;

            /**
             * Encodes the specified VitalStatus message. Does not implicitly {@link org.phenopackets.schema.v2.core.VitalStatus.verify|verify} messages.
             * @param message VitalStatus message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IVitalStatus,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified VitalStatus message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.VitalStatus.verify|verify} messages.
             * @param message VitalStatus message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IVitalStatus,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a VitalStatus message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns VitalStatus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.VitalStatus;

            /**
             * Decodes a VitalStatus message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns VitalStatus
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.VitalStatus;

            /**
             * Verifies a VitalStatus message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a VitalStatus message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns VitalStatus
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.VitalStatus;

            /**
             * Creates a plain object from a VitalStatus message. Also converts values to other types if specified.
             * @param message VitalStatus
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.VitalStatus,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this VitalStatus to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for VitalStatus
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          namespace VitalStatus {
            /** Status enum. */
            enum Status {
              UNKNOWN_STATUS = 0,
              ALIVE = 1,
              DECEASED = 2,
            }
          }

          /** Sex enum. */
          enum Sex {
            UNKNOWN_SEX = 0,
            FEMALE = 1,
            MALE = 2,
            OTHER_SEX = 3,
          }

          /** KaryotypicSex enum. */
          enum KaryotypicSex {
            UNKNOWN_KARYOTYPE = 0,
            XX = 1,
            XY = 2,
            XO = 3,
            XXY = 4,
            XXX = 5,
            XXYY = 6,
            XXXY = 7,
            XXXX = 8,
            XYY = 9,
            OTHER_KARYOTYPE = 10,
          }

          /** Properties of a MedicalAction. */
          interface IMedicalAction {
            /** MedicalAction procedure */
            procedure?: org.phenopackets.schema.v2.core.IProcedure | null;

            /** MedicalAction treatment */
            treatment?: org.phenopackets.schema.v2.core.ITreatment | null;

            /** MedicalAction radiationTherapy */
            radiationTherapy?: org.phenopackets.schema.v2.core.IRadiationTherapy | null;

            /** MedicalAction therapeuticRegimen */
            therapeuticRegimen?: org.phenopackets.schema.v2.core.ITherapeuticRegimen | null;

            /** MedicalAction treatmentTarget */
            treatmentTarget?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** MedicalAction treatmentIntent */
            treatmentIntent?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** MedicalAction responseToTreatment */
            responseToTreatment?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** MedicalAction adverseEvents */
            adverseEvents?:
              | org.phenopackets.schema.v2.core.IOntologyClass[]
              | null;

            /** MedicalAction treatmentTerminationReason */
            treatmentTerminationReason?: org.phenopackets.schema.v2.core.IOntologyClass | null;
          }

          /** Represents a MedicalAction. */
          class MedicalAction implements IMedicalAction {
            /**
             * Constructs a new MedicalAction.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IMedicalAction
            );

            /** MedicalAction procedure. */
            public procedure?: org.phenopackets.schema.v2.core.IProcedure | null;

            /** MedicalAction treatment. */
            public treatment?: org.phenopackets.schema.v2.core.ITreatment | null;

            /** MedicalAction radiationTherapy. */
            public radiationTherapy?: org.phenopackets.schema.v2.core.IRadiationTherapy | null;

            /** MedicalAction therapeuticRegimen. */
            public therapeuticRegimen?: org.phenopackets.schema.v2.core.ITherapeuticRegimen | null;

            /** MedicalAction treatmentTarget. */
            public treatmentTarget?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** MedicalAction treatmentIntent. */
            public treatmentIntent?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** MedicalAction responseToTreatment. */
            public responseToTreatment?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** MedicalAction adverseEvents. */
            public adverseEvents: org.phenopackets.schema.v2.core.IOntologyClass[];

            /** MedicalAction treatmentTerminationReason. */
            public treatmentTerminationReason?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** MedicalAction action. */
            public action?:
              | "procedure"
              | "treatment"
              | "radiationTherapy"
              | "therapeuticRegimen";

            /**
             * Creates a new MedicalAction instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MedicalAction instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IMedicalAction
            ): org.phenopackets.schema.v2.core.MedicalAction;

            /**
             * Encodes the specified MedicalAction message. Does not implicitly {@link org.phenopackets.schema.v2.core.MedicalAction.verify|verify} messages.
             * @param message MedicalAction message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IMedicalAction,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified MedicalAction message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.MedicalAction.verify|verify} messages.
             * @param message MedicalAction message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IMedicalAction,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a MedicalAction message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MedicalAction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.MedicalAction;

            /**
             * Decodes a MedicalAction message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MedicalAction
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.MedicalAction;

            /**
             * Verifies a MedicalAction message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a MedicalAction message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MedicalAction
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.MedicalAction;

            /**
             * Creates a plain object from a MedicalAction message. Also converts values to other types if specified.
             * @param message MedicalAction
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.MedicalAction,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this MedicalAction to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MedicalAction
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Treatment. */
          interface ITreatment {
            /** Treatment agent */
            agent?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Treatment routeOfAdministration */
            routeOfAdministration?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Treatment doseIntervals */
            doseIntervals?:
              | org.phenopackets.schema.v2.core.IDoseInterval[]
              | null;

            /** Treatment drugType */
            drugType?: org.phenopackets.schema.v2.core.DrugType | null;

            /** Treatment cumulativeDose */
            cumulativeDose?: org.phenopackets.schema.v2.core.IQuantity | null;
          }

          /** Represents a Treatment. */
          class Treatment implements ITreatment {
            /**
             * Constructs a new Treatment.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.ITreatment
            );

            /** Treatment agent. */
            public agent?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Treatment routeOfAdministration. */
            public routeOfAdministration?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** Treatment doseIntervals. */
            public doseIntervals: org.phenopackets.schema.v2.core.IDoseInterval[];

            /** Treatment drugType. */
            public drugType: org.phenopackets.schema.v2.core.DrugType;

            /** Treatment cumulativeDose. */
            public cumulativeDose?: org.phenopackets.schema.v2.core.IQuantity | null;

            /**
             * Creates a new Treatment instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Treatment instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.ITreatment
            ): org.phenopackets.schema.v2.core.Treatment;

            /**
             * Encodes the specified Treatment message. Does not implicitly {@link org.phenopackets.schema.v2.core.Treatment.verify|verify} messages.
             * @param message Treatment message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.ITreatment,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Treatment message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Treatment.verify|verify} messages.
             * @param message Treatment message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.ITreatment,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Treatment message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Treatment
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Treatment;

            /**
             * Decodes a Treatment message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Treatment
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Treatment;

            /**
             * Verifies a Treatment message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Treatment message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Treatment
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Treatment;

            /**
             * Creates a plain object from a Treatment message. Also converts values to other types if specified.
             * @param message Treatment
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Treatment,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Treatment to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Treatment
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a DoseInterval. */
          interface IDoseInterval {
            /** DoseInterval quantity */
            quantity?: org.phenopackets.schema.v2.core.IQuantity | null;

            /** DoseInterval scheduleFrequency */
            scheduleFrequency?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** DoseInterval interval */
            interval?: org.phenopackets.schema.v2.core.ITimeInterval | null;
          }

          /** Represents a DoseInterval. */
          class DoseInterval implements IDoseInterval {
            /**
             * Constructs a new DoseInterval.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IDoseInterval
            );

            /** DoseInterval quantity. */
            public quantity?: org.phenopackets.schema.v2.core.IQuantity | null;

            /** DoseInterval scheduleFrequency. */
            public scheduleFrequency?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** DoseInterval interval. */
            public interval?: org.phenopackets.schema.v2.core.ITimeInterval | null;

            /**
             * Creates a new DoseInterval instance using the specified properties.
             * @param [properties] Properties to set
             * @returns DoseInterval instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IDoseInterval
            ): org.phenopackets.schema.v2.core.DoseInterval;

            /**
             * Encodes the specified DoseInterval message. Does not implicitly {@link org.phenopackets.schema.v2.core.DoseInterval.verify|verify} messages.
             * @param message DoseInterval message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IDoseInterval,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified DoseInterval message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.DoseInterval.verify|verify} messages.
             * @param message DoseInterval message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IDoseInterval,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a DoseInterval message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns DoseInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.DoseInterval;

            /**
             * Decodes a DoseInterval message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns DoseInterval
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.DoseInterval;

            /**
             * Verifies a DoseInterval message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a DoseInterval message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns DoseInterval
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.DoseInterval;

            /**
             * Creates a plain object from a DoseInterval message. Also converts values to other types if specified.
             * @param message DoseInterval
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.DoseInterval,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this DoseInterval to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for DoseInterval
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** DrugType enum. */
          enum DrugType {
            UNKNOWN_DRUG_TYPE = 0,
            PRESCRIPTION = 1,
            EHR_MEDICATION_LIST = 2,
            ADMINISTRATION_RELATED_TO_PROCEDURE = 3,
          }

          /** Properties of a RadiationTherapy. */
          interface IRadiationTherapy {
            /** RadiationTherapy modality */
            modality?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** RadiationTherapy bodySite */
            bodySite?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** RadiationTherapy dosage */
            dosage?: number | null;

            /** RadiationTherapy fractions */
            fractions?: number | null;
          }

          /** Represents a RadiationTherapy. */
          class RadiationTherapy implements IRadiationTherapy {
            /**
             * Constructs a new RadiationTherapy.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.IRadiationTherapy
            );

            /** RadiationTherapy modality. */
            public modality?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** RadiationTherapy bodySite. */
            public bodySite?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** RadiationTherapy dosage. */
            public dosage: number;

            /** RadiationTherapy fractions. */
            public fractions: number;

            /**
             * Creates a new RadiationTherapy instance using the specified properties.
             * @param [properties] Properties to set
             * @returns RadiationTherapy instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IRadiationTherapy
            ): org.phenopackets.schema.v2.core.RadiationTherapy;

            /**
             * Encodes the specified RadiationTherapy message. Does not implicitly {@link org.phenopackets.schema.v2.core.RadiationTherapy.verify|verify} messages.
             * @param message RadiationTherapy message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IRadiationTherapy,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified RadiationTherapy message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.RadiationTherapy.verify|verify} messages.
             * @param message RadiationTherapy message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IRadiationTherapy,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a RadiationTherapy message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns RadiationTherapy
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.RadiationTherapy;

            /**
             * Decodes a RadiationTherapy message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns RadiationTherapy
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.RadiationTherapy;

            /**
             * Verifies a RadiationTherapy message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a RadiationTherapy message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns RadiationTherapy
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.RadiationTherapy;

            /**
             * Creates a plain object from a RadiationTherapy message. Also converts values to other types if specified.
             * @param message RadiationTherapy
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.RadiationTherapy,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this RadiationTherapy to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for RadiationTherapy
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a TherapeuticRegimen. */
          interface ITherapeuticRegimen {
            /** TherapeuticRegimen externalReference */
            externalReference?: org.phenopackets.schema.v2.core.IExternalReference | null;

            /** TherapeuticRegimen ontologyClass */
            ontologyClass?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** TherapeuticRegimen startTime */
            startTime?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** TherapeuticRegimen endTime */
            endTime?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** TherapeuticRegimen regimenStatus */
            regimenStatus?: org.phenopackets.schema.v2.core.TherapeuticRegimen.RegimenStatus | null;
          }

          /** Represents a TherapeuticRegimen. */
          class TherapeuticRegimen implements ITherapeuticRegimen {
            /**
             * Constructs a new TherapeuticRegimen.
             * @param [properties] Properties to set
             */
            constructor(
              properties?: org.phenopackets.schema.v2.core.ITherapeuticRegimen
            );

            /** TherapeuticRegimen externalReference. */
            public externalReference?: org.phenopackets.schema.v2.core.IExternalReference | null;

            /** TherapeuticRegimen ontologyClass. */
            public ontologyClass?: org.phenopackets.schema.v2.core.IOntologyClass | null;

            /** TherapeuticRegimen startTime. */
            public startTime?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** TherapeuticRegimen endTime. */
            public endTime?: org.phenopackets.schema.v2.core.ITimeElement | null;

            /** TherapeuticRegimen regimenStatus. */
            public regimenStatus: org.phenopackets.schema.v2.core.TherapeuticRegimen.RegimenStatus;

            /** TherapeuticRegimen identifier. */
            public identifier?: "externalReference" | "ontologyClass";

            /**
             * Creates a new TherapeuticRegimen instance using the specified properties.
             * @param [properties] Properties to set
             * @returns TherapeuticRegimen instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.ITherapeuticRegimen
            ): org.phenopackets.schema.v2.core.TherapeuticRegimen;

            /**
             * Encodes the specified TherapeuticRegimen message. Does not implicitly {@link org.phenopackets.schema.v2.core.TherapeuticRegimen.verify|verify} messages.
             * @param message TherapeuticRegimen message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.ITherapeuticRegimen,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified TherapeuticRegimen message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.TherapeuticRegimen.verify|verify} messages.
             * @param message TherapeuticRegimen message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.ITherapeuticRegimen,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a TherapeuticRegimen message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns TherapeuticRegimen
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.TherapeuticRegimen;

            /**
             * Decodes a TherapeuticRegimen message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns TherapeuticRegimen
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.TherapeuticRegimen;

            /**
             * Verifies a TherapeuticRegimen message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a TherapeuticRegimen message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns TherapeuticRegimen
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.TherapeuticRegimen;

            /**
             * Creates a plain object from a TherapeuticRegimen message. Also converts values to other types if specified.
             * @param message TherapeuticRegimen
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.TherapeuticRegimen,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this TherapeuticRegimen to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for TherapeuticRegimen
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          namespace TherapeuticRegimen {
            /** RegimenStatus enum. */
            enum RegimenStatus {
              UNKNOWN_STATUS = 0,
              STARTED = 1,
              COMPLETED = 2,
              DISCONTINUED = 3,
            }
          }

          /** Properties of a MetaData. */
          interface IMetaData {
            /** MetaData created */
            created?: google.protobuf.ITimestamp | null;

            /** MetaData createdBy */
            createdBy?: string | null;

            /** MetaData submittedBy */
            submittedBy?: string | null;

            /** MetaData resources */
            resources?: org.phenopackets.schema.v2.core.IResource[] | null;

            /** MetaData updates */
            updates?: org.phenopackets.schema.v2.core.IUpdate[] | null;

            /** MetaData phenopacketSchemaVersion */
            phenopacketSchemaVersion?: string | null;

            /** MetaData externalReferences */
            externalReferences?:
              | org.phenopackets.schema.v2.core.IExternalReference[]
              | null;
          }

          /** Represents a MetaData. */
          class MetaData implements IMetaData {
            /**
             * Constructs a new MetaData.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IMetaData);

            /** MetaData created. */
            public created?: google.protobuf.ITimestamp | null;

            /** MetaData createdBy. */
            public createdBy: string;

            /** MetaData submittedBy. */
            public submittedBy: string;

            /** MetaData resources. */
            public resources: org.phenopackets.schema.v2.core.IResource[];

            /** MetaData updates. */
            public updates: org.phenopackets.schema.v2.core.IUpdate[];

            /** MetaData phenopacketSchemaVersion. */
            public phenopacketSchemaVersion: string;

            /** MetaData externalReferences. */
            public externalReferences: org.phenopackets.schema.v2.core.IExternalReference[];

            /**
             * Creates a new MetaData instance using the specified properties.
             * @param [properties] Properties to set
             * @returns MetaData instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IMetaData
            ): org.phenopackets.schema.v2.core.MetaData;

            /**
             * Encodes the specified MetaData message. Does not implicitly {@link org.phenopackets.schema.v2.core.MetaData.verify|verify} messages.
             * @param message MetaData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IMetaData,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified MetaData message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.MetaData.verify|verify} messages.
             * @param message MetaData message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IMetaData,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a MetaData message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns MetaData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.MetaData;

            /**
             * Decodes a MetaData message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns MetaData
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.MetaData;

            /**
             * Verifies a MetaData message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a MetaData message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns MetaData
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.MetaData;

            /**
             * Creates a plain object from a MetaData message. Also converts values to other types if specified.
             * @param message MetaData
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.MetaData,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this MetaData to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for MetaData
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Resource. */
          interface IResource {
            /** Resource id */
            id?: string | null;

            /** Resource name */
            name?: string | null;

            /** Resource url */
            url?: string | null;

            /** Resource version */
            version?: string | null;

            /** Resource namespacePrefix */
            namespacePrefix?: string | null;

            /** Resource iriPrefix */
            iriPrefix?: string | null;
          }

          /** Represents a Resource. */
          class Resource implements IResource {
            /**
             * Constructs a new Resource.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IResource);

            /** Resource id. */
            public id: string;

            /** Resource name. */
            public name: string;

            /** Resource url. */
            public url: string;

            /** Resource version. */
            public version: string;

            /** Resource namespacePrefix. */
            public namespacePrefix: string;

            /** Resource iriPrefix. */
            public iriPrefix: string;

            /**
             * Creates a new Resource instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Resource instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IResource
            ): org.phenopackets.schema.v2.core.Resource;

            /**
             * Encodes the specified Resource message. Does not implicitly {@link org.phenopackets.schema.v2.core.Resource.verify|verify} messages.
             * @param message Resource message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IResource,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Resource message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Resource.verify|verify} messages.
             * @param message Resource message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IResource,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Resource message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Resource
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Resource;

            /**
             * Decodes a Resource message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Resource
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Resource;

            /**
             * Verifies a Resource message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Resource message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Resource
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Resource;

            /**
             * Creates a plain object from a Resource message. Also converts values to other types if specified.
             * @param message Resource
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Resource,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Resource to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Resource
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of an Update. */
          interface IUpdate {
            /** Update timestamp */
            timestamp?: google.protobuf.ITimestamp | null;

            /** Update updatedBy */
            updatedBy?: string | null;

            /** Update comment */
            comment?: string | null;
          }

          /** Represents an Update. */
          class Update implements IUpdate {
            /**
             * Constructs a new Update.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IUpdate);

            /** Update timestamp. */
            public timestamp?: google.protobuf.ITimestamp | null;

            /** Update updatedBy. */
            public updatedBy: string;

            /** Update comment. */
            public comment: string;

            /**
             * Creates a new Update instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Update instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IUpdate
            ): org.phenopackets.schema.v2.core.Update;

            /**
             * Encodes the specified Update message. Does not implicitly {@link org.phenopackets.schema.v2.core.Update.verify|verify} messages.
             * @param message Update message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IUpdate,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Update message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Update.verify|verify} messages.
             * @param message Update message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IUpdate,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes an Update message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Update
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Update;

            /**
             * Decodes an Update message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Update
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Update;

            /**
             * Verifies an Update message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates an Update message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Update
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Update;

            /**
             * Creates a plain object from an Update message. Also converts values to other types if specified.
             * @param message Update
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Update,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Update to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Update
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          /** Properties of a Pedigree. */
          interface IPedigree {
            /** Pedigree persons */
            persons?: org.phenopackets.schema.v2.core.Pedigree.IPerson[] | null;
          }

          /** Represents a Pedigree. */
          class Pedigree implements IPedigree {
            /**
             * Constructs a new Pedigree.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.phenopackets.schema.v2.core.IPedigree);

            /** Pedigree persons. */
            public persons: org.phenopackets.schema.v2.core.Pedigree.IPerson[];

            /**
             * Creates a new Pedigree instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Pedigree instance
             */
            public static create(
              properties?: org.phenopackets.schema.v2.core.IPedigree
            ): org.phenopackets.schema.v2.core.Pedigree;

            /**
             * Encodes the specified Pedigree message. Does not implicitly {@link org.phenopackets.schema.v2.core.Pedigree.verify|verify} messages.
             * @param message Pedigree message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.phenopackets.schema.v2.core.IPedigree,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Pedigree message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Pedigree.verify|verify} messages.
             * @param message Pedigree message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.phenopackets.schema.v2.core.IPedigree,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Pedigree message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Pedigree
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.phenopackets.schema.v2.core.Pedigree;

            /**
             * Decodes a Pedigree message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Pedigree
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.phenopackets.schema.v2.core.Pedigree;

            /**
             * Verifies a Pedigree message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Pedigree message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Pedigree
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.phenopackets.schema.v2.core.Pedigree;

            /**
             * Creates a plain object from a Pedigree message. Also converts values to other types if specified.
             * @param message Pedigree
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.phenopackets.schema.v2.core.Pedigree,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Pedigree to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Pedigree
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }

          namespace Pedigree {
            /** Properties of a Person. */
            interface IPerson {
              /** Person familyId */
              familyId?: string | null;

              /** Person individualId */
              individualId?: string | null;

              /** Person paternalId */
              paternalId?: string | null;

              /** Person maternalId */
              maternalId?: string | null;

              /** Person sex */
              sex?: org.phenopackets.schema.v2.core.Sex | null;

              /** Person affectedStatus */
              affectedStatus?: org.phenopackets.schema.v2.core.Pedigree.Person.AffectedStatus | null;
            }

            /** Represents a Person. */
            class Person implements IPerson {
              /**
               * Constructs a new Person.
               * @param [properties] Properties to set
               */
              constructor(
                properties?: org.phenopackets.schema.v2.core.Pedigree.IPerson
              );

              /** Person familyId. */
              public familyId: string;

              /** Person individualId. */
              public individualId: string;

              /** Person paternalId. */
              public paternalId: string;

              /** Person maternalId. */
              public maternalId: string;

              /** Person sex. */
              public sex: org.phenopackets.schema.v2.core.Sex;

              /** Person affectedStatus. */
              public affectedStatus: org.phenopackets.schema.v2.core.Pedigree.Person.AffectedStatus;

              /**
               * Creates a new Person instance using the specified properties.
               * @param [properties] Properties to set
               * @returns Person instance
               */
              public static create(
                properties?: org.phenopackets.schema.v2.core.Pedigree.IPerson
              ): org.phenopackets.schema.v2.core.Pedigree.Person;

              /**
               * Encodes the specified Person message. Does not implicitly {@link org.phenopackets.schema.v2.core.Pedigree.Person.verify|verify} messages.
               * @param message Person message or plain object to encode
               * @param [writer] Writer to encode to
               * @returns Writer
               */
              public static encode(
                message: org.phenopackets.schema.v2.core.Pedigree.IPerson,
                writer?: $protobuf.Writer
              ): $protobuf.Writer;

              /**
               * Encodes the specified Person message, length delimited. Does not implicitly {@link org.phenopackets.schema.v2.core.Pedigree.Person.verify|verify} messages.
               * @param message Person message or plain object to encode
               * @param [writer] Writer to encode to
               * @returns Writer
               */
              public static encodeDelimited(
                message: org.phenopackets.schema.v2.core.Pedigree.IPerson,
                writer?: $protobuf.Writer
              ): $protobuf.Writer;

              /**
               * Decodes a Person message from the specified reader or buffer.
               * @param reader Reader or buffer to decode from
               * @param [length] Message length if known beforehand
               * @returns Person
               * @throws {Error} If the payload is not a reader or valid buffer
               * @throws {$protobuf.util.ProtocolError} If required fields are missing
               */
              public static decode(
                reader: $protobuf.Reader | Uint8Array,
                length?: number
              ): org.phenopackets.schema.v2.core.Pedigree.Person;

              /**
               * Decodes a Person message from the specified reader or buffer, length delimited.
               * @param reader Reader or buffer to decode from
               * @returns Person
               * @throws {Error} If the payload is not a reader or valid buffer
               * @throws {$protobuf.util.ProtocolError} If required fields are missing
               */
              public static decodeDelimited(
                reader: $protobuf.Reader | Uint8Array
              ): org.phenopackets.schema.v2.core.Pedigree.Person;

              /**
               * Verifies a Person message.
               * @param message Plain object to verify
               * @returns `null` if valid, otherwise the reason why it is not
               */
              public static verify(message: {
                [k: string]: any;
              }): string | null;

              /**
               * Creates a Person message from a plain object. Also converts values to their respective internal types.
               * @param object Plain object
               * @returns Person
               */
              public static fromObject(object: {
                [k: string]: any;
              }): org.phenopackets.schema.v2.core.Pedigree.Person;

              /**
               * Creates a plain object from a Person message. Also converts values to other types if specified.
               * @param message Person
               * @param [options] Conversion options
               * @returns Plain object
               */
              public static toObject(
                message: org.phenopackets.schema.v2.core.Pedigree.Person,
                options?: $protobuf.IConversionOptions
              ): { [k: string]: any };

              /**
               * Converts this Person to JSON.
               * @returns JSON object
               */
              public toJSON(): { [k: string]: any };

              /**
               * Gets the default type url for Person
               * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
               * @returns The default type url
               */
              public static getTypeUrl(typeUrlPrefix?: string): string;
            }

            namespace Person {
              /** AffectedStatus enum. */
              enum AffectedStatus {
                MISSING = 0,
                UNAFFECTED = 1,
                AFFECTED = 2,
              }
            }
          }
        }
      }
    }
  }

  /** Namespace ga4gh. */
  namespace ga4gh {
    /** Namespace vrsatile. */
    namespace vrsatile {
      /** Namespace v1. */
      namespace v1 {
        /** Properties of an Extension. */
        interface IExtension {
          /** Extension name */
          name?: string | null;

          /** Extension value */
          value?: string | null;
        }

        /** Represents an Extension. */
        class Extension implements IExtension {
          /**
           * Constructs a new Extension.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrsatile.v1.IExtension);

          /** Extension name. */
          public name: string;

          /** Extension value. */
          public value: string;

          /**
           * Creates a new Extension instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Extension instance
           */
          public static create(
            properties?: org.ga4gh.vrsatile.v1.IExtension
          ): org.ga4gh.vrsatile.v1.Extension;

          /**
           * Encodes the specified Extension message. Does not implicitly {@link org.ga4gh.vrsatile.v1.Extension.verify|verify} messages.
           * @param message Extension message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrsatile.v1.IExtension,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Extension message, length delimited. Does not implicitly {@link org.ga4gh.vrsatile.v1.Extension.verify|verify} messages.
           * @param message Extension message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrsatile.v1.IExtension,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes an Extension message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Extension
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrsatile.v1.Extension;

          /**
           * Decodes an Extension message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Extension
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrsatile.v1.Extension;

          /**
           * Verifies an Extension message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates an Extension message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Extension
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrsatile.v1.Extension;

          /**
           * Creates a plain object from an Extension message. Also converts values to other types if specified.
           * @param message Extension
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrsatile.v1.Extension,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Extension to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Extension
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an Expression. */
        interface IExpression {
          /** Expression syntax */
          syntax?: string | null;

          /** Expression value */
          value?: string | null;

          /** Expression version */
          version?: string | null;
        }

        /** Represents an Expression. */
        class Expression implements IExpression {
          /**
           * Constructs a new Expression.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrsatile.v1.IExpression);

          /** Expression syntax. */
          public syntax: string;

          /** Expression value. */
          public value: string;

          /** Expression version. */
          public version: string;

          /**
           * Creates a new Expression instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Expression instance
           */
          public static create(
            properties?: org.ga4gh.vrsatile.v1.IExpression
          ): org.ga4gh.vrsatile.v1.Expression;

          /**
           * Encodes the specified Expression message. Does not implicitly {@link org.ga4gh.vrsatile.v1.Expression.verify|verify} messages.
           * @param message Expression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrsatile.v1.IExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Expression message, length delimited. Does not implicitly {@link org.ga4gh.vrsatile.v1.Expression.verify|verify} messages.
           * @param message Expression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrsatile.v1.IExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes an Expression message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Expression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrsatile.v1.Expression;

          /**
           * Decodes an Expression message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Expression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrsatile.v1.Expression;

          /**
           * Verifies an Expression message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates an Expression message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Expression
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrsatile.v1.Expression;

          /**
           * Creates a plain object from an Expression message. Also converts values to other types if specified.
           * @param message Expression
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrsatile.v1.Expression,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Expression to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Expression
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a VcfRecord. */
        interface IVcfRecord {
          /** VcfRecord genomeAssembly */
          genomeAssembly?: string | null;

          /** VcfRecord chrom */
          chrom?: string | null;

          /** VcfRecord pos */
          pos?: number | Long | null;

          /** VcfRecord id */
          id?: string | null;

          /** VcfRecord ref */
          ref?: string | null;

          /** VcfRecord alt */
          alt?: string | null;

          /** VcfRecord qual */
          qual?: string | null;

          /** VcfRecord filter */
          filter?: string | null;

          /** VcfRecord info */
          info?: string | null;
        }

        /** Represents a VcfRecord. */
        class VcfRecord implements IVcfRecord {
          /**
           * Constructs a new VcfRecord.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrsatile.v1.IVcfRecord);

          /** VcfRecord genomeAssembly. */
          public genomeAssembly: string;

          /** VcfRecord chrom. */
          public chrom: string;

          /** VcfRecord pos. */
          public pos: number | Long;

          /** VcfRecord id. */
          public id: string;

          /** VcfRecord ref. */
          public ref: string;

          /** VcfRecord alt. */
          public alt: string;

          /** VcfRecord qual. */
          public qual: string;

          /** VcfRecord filter. */
          public filter: string;

          /** VcfRecord info. */
          public info: string;

          /**
           * Creates a new VcfRecord instance using the specified properties.
           * @param [properties] Properties to set
           * @returns VcfRecord instance
           */
          public static create(
            properties?: org.ga4gh.vrsatile.v1.IVcfRecord
          ): org.ga4gh.vrsatile.v1.VcfRecord;

          /**
           * Encodes the specified VcfRecord message. Does not implicitly {@link org.ga4gh.vrsatile.v1.VcfRecord.verify|verify} messages.
           * @param message VcfRecord message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrsatile.v1.IVcfRecord,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified VcfRecord message, length delimited. Does not implicitly {@link org.ga4gh.vrsatile.v1.VcfRecord.verify|verify} messages.
           * @param message VcfRecord message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrsatile.v1.IVcfRecord,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a VcfRecord message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns VcfRecord
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrsatile.v1.VcfRecord;

          /**
           * Decodes a VcfRecord message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns VcfRecord
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrsatile.v1.VcfRecord;

          /**
           * Verifies a VcfRecord message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a VcfRecord message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns VcfRecord
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrsatile.v1.VcfRecord;

          /**
           * Creates a plain object from a VcfRecord message. Also converts values to other types if specified.
           * @param message VcfRecord
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrsatile.v1.VcfRecord,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this VcfRecord to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for VcfRecord
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a VariationDescriptor. */
        interface IVariationDescriptor {
          /** VariationDescriptor id */
          id?: string | null;

          /** VariationDescriptor variation */
          variation?: org.ga4gh.vrs.v1.IVariation | null;

          /** VariationDescriptor label */
          label?: string | null;

          /** VariationDescriptor description */
          description?: string | null;

          /** VariationDescriptor geneContext */
          geneContext?: org.ga4gh.vrsatile.v1.IGeneDescriptor | null;

          /** VariationDescriptor expressions */
          expressions?: org.ga4gh.vrsatile.v1.IExpression[] | null;

          /** VariationDescriptor vcfRecord */
          vcfRecord?: org.ga4gh.vrsatile.v1.IVcfRecord | null;

          /** VariationDescriptor xrefs */
          xrefs?: string[] | null;

          /** VariationDescriptor alternateLabels */
          alternateLabels?: string[] | null;

          /** VariationDescriptor extensions */
          extensions?: org.ga4gh.vrsatile.v1.IExtension[] | null;

          /** VariationDescriptor moleculeContext */
          moleculeContext?: org.ga4gh.vrsatile.v1.MoleculeContext | null;

          /** VariationDescriptor structuralType */
          structuralType?: org.phenopackets.schema.v2.core.IOntologyClass | null;

          /** VariationDescriptor vrsRefAlleleSeq */
          vrsRefAlleleSeq?: string | null;

          /** VariationDescriptor allelicState */
          allelicState?: org.phenopackets.schema.v2.core.IOntologyClass | null;
        }

        /** Represents a VariationDescriptor. */
        class VariationDescriptor implements IVariationDescriptor {
          /**
           * Constructs a new VariationDescriptor.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrsatile.v1.IVariationDescriptor);

          /** VariationDescriptor id. */
          public id: string;

          /** VariationDescriptor variation. */
          public variation?: org.ga4gh.vrs.v1.IVariation | null;

          /** VariationDescriptor label. */
          public label: string;

          /** VariationDescriptor description. */
          public description: string;

          /** VariationDescriptor geneContext. */
          public geneContext?: org.ga4gh.vrsatile.v1.IGeneDescriptor | null;

          /** VariationDescriptor expressions. */
          public expressions: org.ga4gh.vrsatile.v1.IExpression[];

          /** VariationDescriptor vcfRecord. */
          public vcfRecord?: org.ga4gh.vrsatile.v1.IVcfRecord | null;

          /** VariationDescriptor xrefs. */
          public xrefs: string[];

          /** VariationDescriptor alternateLabels. */
          public alternateLabels: string[];

          /** VariationDescriptor extensions. */
          public extensions: org.ga4gh.vrsatile.v1.IExtension[];

          /** VariationDescriptor moleculeContext. */
          public moleculeContext: org.ga4gh.vrsatile.v1.MoleculeContext;

          /** VariationDescriptor structuralType. */
          public structuralType?: org.phenopackets.schema.v2.core.IOntologyClass | null;

          /** VariationDescriptor vrsRefAlleleSeq. */
          public vrsRefAlleleSeq: string;

          /** VariationDescriptor allelicState. */
          public allelicState?: org.phenopackets.schema.v2.core.IOntologyClass | null;

          /**
           * Creates a new VariationDescriptor instance using the specified properties.
           * @param [properties] Properties to set
           * @returns VariationDescriptor instance
           */
          public static create(
            properties?: org.ga4gh.vrsatile.v1.IVariationDescriptor
          ): org.ga4gh.vrsatile.v1.VariationDescriptor;

          /**
           * Encodes the specified VariationDescriptor message. Does not implicitly {@link org.ga4gh.vrsatile.v1.VariationDescriptor.verify|verify} messages.
           * @param message VariationDescriptor message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrsatile.v1.IVariationDescriptor,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified VariationDescriptor message, length delimited. Does not implicitly {@link org.ga4gh.vrsatile.v1.VariationDescriptor.verify|verify} messages.
           * @param message VariationDescriptor message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrsatile.v1.IVariationDescriptor,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a VariationDescriptor message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns VariationDescriptor
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrsatile.v1.VariationDescriptor;

          /**
           * Decodes a VariationDescriptor message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns VariationDescriptor
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrsatile.v1.VariationDescriptor;

          /**
           * Verifies a VariationDescriptor message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a VariationDescriptor message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns VariationDescriptor
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrsatile.v1.VariationDescriptor;

          /**
           * Creates a plain object from a VariationDescriptor message. Also converts values to other types if specified.
           * @param message VariationDescriptor
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrsatile.v1.VariationDescriptor,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this VariationDescriptor to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for VariationDescriptor
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** MoleculeContext enum. */
        enum MoleculeContext {
          unspecified_molecule_context = 0,
          genomic = 1,
          transcript = 2,
          protein = 3,
        }

        /** Properties of a GeneDescriptor. */
        interface IGeneDescriptor {
          /** GeneDescriptor valueId */
          valueId?: string | null;

          /** GeneDescriptor symbol */
          symbol?: string | null;

          /** GeneDescriptor description */
          description?: string | null;

          /** GeneDescriptor alternateIds */
          alternateIds?: string[] | null;

          /** GeneDescriptor alternateSymbols */
          alternateSymbols?: string[] | null;

          /** GeneDescriptor xrefs */
          xrefs?: string[] | null;
        }

        /** Represents a GeneDescriptor. */
        class GeneDescriptor implements IGeneDescriptor {
          /**
           * Constructs a new GeneDescriptor.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrsatile.v1.IGeneDescriptor);

          /** GeneDescriptor valueId. */
          public valueId: string;

          /** GeneDescriptor symbol. */
          public symbol: string;

          /** GeneDescriptor description. */
          public description: string;

          /** GeneDescriptor alternateIds. */
          public alternateIds: string[];

          /** GeneDescriptor alternateSymbols. */
          public alternateSymbols: string[];

          /** GeneDescriptor xrefs. */
          public xrefs: string[];

          /**
           * Creates a new GeneDescriptor instance using the specified properties.
           * @param [properties] Properties to set
           * @returns GeneDescriptor instance
           */
          public static create(
            properties?: org.ga4gh.vrsatile.v1.IGeneDescriptor
          ): org.ga4gh.vrsatile.v1.GeneDescriptor;

          /**
           * Encodes the specified GeneDescriptor message. Does not implicitly {@link org.ga4gh.vrsatile.v1.GeneDescriptor.verify|verify} messages.
           * @param message GeneDescriptor message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrsatile.v1.IGeneDescriptor,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified GeneDescriptor message, length delimited. Does not implicitly {@link org.ga4gh.vrsatile.v1.GeneDescriptor.verify|verify} messages.
           * @param message GeneDescriptor message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrsatile.v1.IGeneDescriptor,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a GeneDescriptor message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns GeneDescriptor
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrsatile.v1.GeneDescriptor;

          /**
           * Decodes a GeneDescriptor message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns GeneDescriptor
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrsatile.v1.GeneDescriptor;

          /**
           * Verifies a GeneDescriptor message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a GeneDescriptor message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns GeneDescriptor
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrsatile.v1.GeneDescriptor;

          /**
           * Creates a plain object from a GeneDescriptor message. Also converts values to other types if specified.
           * @param message GeneDescriptor
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrsatile.v1.GeneDescriptor,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this GeneDescriptor to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for GeneDescriptor
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }
      }
    }

    /** Namespace vrs. */
    namespace vrs {
      /** Namespace v1. */
      namespace v1 {
        /** Properties of a Variation. */
        interface IVariation {
          /** Variation allele */
          allele?: org.ga4gh.vrs.v1.IAllele | null;

          /** Variation haplotype */
          haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;

          /** Variation copyNumber */
          copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;

          /** Variation text */
          text?: org.ga4gh.vrs.v1.IText | null;

          /** Variation variationSet */
          variationSet?: org.ga4gh.vrs.v1.IVariationSet | null;
        }

        /** Represents a Variation. */
        class Variation implements IVariation {
          /**
           * Constructs a new Variation.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IVariation);

          /** Variation allele. */
          public allele?: org.ga4gh.vrs.v1.IAllele | null;

          /** Variation haplotype. */
          public haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;

          /** Variation copyNumber. */
          public copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;

          /** Variation text. */
          public text?: org.ga4gh.vrs.v1.IText | null;

          /** Variation variationSet. */
          public variationSet?: org.ga4gh.vrs.v1.IVariationSet | null;

          /** Variation variation. */
          public variation?:
            | "allele"
            | "haplotype"
            | "copyNumber"
            | "text"
            | "variationSet";

          /**
           * Creates a new Variation instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Variation instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IVariation
          ): org.ga4gh.vrs.v1.Variation;

          /**
           * Encodes the specified Variation message. Does not implicitly {@link org.ga4gh.vrs.v1.Variation.verify|verify} messages.
           * @param message Variation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Variation message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Variation.verify|verify} messages.
           * @param message Variation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Variation message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Variation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Variation;

          /**
           * Decodes a Variation message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Variation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Variation;

          /**
           * Verifies a Variation message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Variation message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Variation
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Variation;

          /**
           * Creates a plain object from a Variation message. Also converts values to other types if specified.
           * @param message Variation
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Variation,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Variation to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Variation
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a MolecularVariation. */
        interface IMolecularVariation {
          /** MolecularVariation allele */
          allele?: org.ga4gh.vrs.v1.IAllele | null;

          /** MolecularVariation haplotype */
          haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;
        }

        /** Represents a MolecularVariation. */
        class MolecularVariation implements IMolecularVariation {
          /**
           * Constructs a new MolecularVariation.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IMolecularVariation);

          /** MolecularVariation allele. */
          public allele?: org.ga4gh.vrs.v1.IAllele | null;

          /** MolecularVariation haplotype. */
          public haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;

          /** MolecularVariation molecularVariation. */
          public molecularVariation?: "allele" | "haplotype";

          /**
           * Creates a new MolecularVariation instance using the specified properties.
           * @param [properties] Properties to set
           * @returns MolecularVariation instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IMolecularVariation
          ): org.ga4gh.vrs.v1.MolecularVariation;

          /**
           * Encodes the specified MolecularVariation message. Does not implicitly {@link org.ga4gh.vrs.v1.MolecularVariation.verify|verify} messages.
           * @param message MolecularVariation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IMolecularVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified MolecularVariation message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.MolecularVariation.verify|verify} messages.
           * @param message MolecularVariation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IMolecularVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a MolecularVariation message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns MolecularVariation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.MolecularVariation;

          /**
           * Decodes a MolecularVariation message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns MolecularVariation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.MolecularVariation;

          /**
           * Verifies a MolecularVariation message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a MolecularVariation message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns MolecularVariation
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.MolecularVariation;

          /**
           * Creates a plain object from a MolecularVariation message. Also converts values to other types if specified.
           * @param message MolecularVariation
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.MolecularVariation,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this MolecularVariation to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for MolecularVariation
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an UtilityVariation. */
        interface IUtilityVariation {
          /** UtilityVariation text */
          text?: org.ga4gh.vrs.v1.IText | null;

          /** UtilityVariation variationSet */
          variationSet?: org.ga4gh.vrs.v1.IVariationSet | null;
        }

        /** Represents an UtilityVariation. */
        class UtilityVariation implements IUtilityVariation {
          /**
           * Constructs a new UtilityVariation.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IUtilityVariation);

          /** UtilityVariation text. */
          public text?: org.ga4gh.vrs.v1.IText | null;

          /** UtilityVariation variationSet. */
          public variationSet?: org.ga4gh.vrs.v1.IVariationSet | null;

          /** UtilityVariation utilityVariation. */
          public utilityVariation?: "text" | "variationSet";

          /**
           * Creates a new UtilityVariation instance using the specified properties.
           * @param [properties] Properties to set
           * @returns UtilityVariation instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IUtilityVariation
          ): org.ga4gh.vrs.v1.UtilityVariation;

          /**
           * Encodes the specified UtilityVariation message. Does not implicitly {@link org.ga4gh.vrs.v1.UtilityVariation.verify|verify} messages.
           * @param message UtilityVariation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IUtilityVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified UtilityVariation message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.UtilityVariation.verify|verify} messages.
           * @param message UtilityVariation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IUtilityVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes an UtilityVariation message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns UtilityVariation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.UtilityVariation;

          /**
           * Decodes an UtilityVariation message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns UtilityVariation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.UtilityVariation;

          /**
           * Verifies an UtilityVariation message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates an UtilityVariation message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns UtilityVariation
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.UtilityVariation;

          /**
           * Creates a plain object from an UtilityVariation message. Also converts values to other types if specified.
           * @param message UtilityVariation
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.UtilityVariation,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this UtilityVariation to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for UtilityVariation
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SystemicVariation. */
        interface ISystemicVariation {
          /** SystemicVariation copyNumber */
          copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;
        }

        /** Represents a SystemicVariation. */
        class SystemicVariation implements ISystemicVariation {
          /**
           * Constructs a new SystemicVariation.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ISystemicVariation);

          /** SystemicVariation copyNumber. */
          public copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;

          /** SystemicVariation systemicVariation. */
          public systemicVariation?: "copyNumber";

          /**
           * Creates a new SystemicVariation instance using the specified properties.
           * @param [properties] Properties to set
           * @returns SystemicVariation instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ISystemicVariation
          ): org.ga4gh.vrs.v1.SystemicVariation;

          /**
           * Encodes the specified SystemicVariation message. Does not implicitly {@link org.ga4gh.vrs.v1.SystemicVariation.verify|verify} messages.
           * @param message SystemicVariation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ISystemicVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified SystemicVariation message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.SystemicVariation.verify|verify} messages.
           * @param message SystemicVariation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ISystemicVariation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a SystemicVariation message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns SystemicVariation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.SystemicVariation;

          /**
           * Decodes a SystemicVariation message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns SystemicVariation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.SystemicVariation;

          /**
           * Verifies a SystemicVariation message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a SystemicVariation message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns SystemicVariation
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.SystemicVariation;

          /**
           * Creates a plain object from a SystemicVariation message. Also converts values to other types if specified.
           * @param message SystemicVariation
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.SystemicVariation,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this SystemicVariation to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for SystemicVariation
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an Allele. */
        interface IAllele {
          /** Allele _id */
          _id?: string | null;

          /** Allele curie */
          curie?: string | null;

          /** Allele chromosomeLocation */
          chromosomeLocation?: org.ga4gh.vrs.v1.IChromosomeLocation | null;

          /** Allele sequenceLocation */
          sequenceLocation?: org.ga4gh.vrs.v1.ISequenceLocation | null;

          /** Allele sequenceState */
          sequenceState?: org.ga4gh.vrs.v1.ISequenceState | null;

          /** Allele literalSequenceExpression */
          literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** Allele derivedSequenceExpression */
          derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** Allele repeatedSequenceExpression */
          repeatedSequenceExpression?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression | null;
        }

        /** Represents an Allele. */
        class Allele implements IAllele {
          /**
           * Constructs a new Allele.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IAllele);

          /** Allele _id. */
          public _id: string;

          /** Allele curie. */
          public curie?: string | null;

          /** Allele chromosomeLocation. */
          public chromosomeLocation?: org.ga4gh.vrs.v1.IChromosomeLocation | null;

          /** Allele sequenceLocation. */
          public sequenceLocation?: org.ga4gh.vrs.v1.ISequenceLocation | null;

          /** Allele sequenceState. */
          public sequenceState?: org.ga4gh.vrs.v1.ISequenceState | null;

          /** Allele literalSequenceExpression. */
          public literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** Allele derivedSequenceExpression. */
          public derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** Allele repeatedSequenceExpression. */
          public repeatedSequenceExpression?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression | null;

          /** Allele location. */
          public location?: "curie" | "chromosomeLocation" | "sequenceLocation";

          /** Allele state. */
          public state?:
            | "sequenceState"
            | "literalSequenceExpression"
            | "derivedSequenceExpression"
            | "repeatedSequenceExpression";

          /**
           * Creates a new Allele instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Allele instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IAllele
          ): org.ga4gh.vrs.v1.Allele;

          /**
           * Encodes the specified Allele message. Does not implicitly {@link org.ga4gh.vrs.v1.Allele.verify|verify} messages.
           * @param message Allele message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IAllele,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Allele message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Allele.verify|verify} messages.
           * @param message Allele message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IAllele,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes an Allele message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Allele
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Allele;

          /**
           * Decodes an Allele message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Allele
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Allele;

          /**
           * Verifies an Allele message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates an Allele message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Allele
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Allele;

          /**
           * Creates a plain object from an Allele message. Also converts values to other types if specified.
           * @param message Allele
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Allele,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Allele to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Allele
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Haplotype. */
        interface IHaplotype {
          /** Haplotype _id */
          _id?: string | null;

          /** Haplotype members */
          members?: org.ga4gh.vrs.v1.Haplotype.IMember[] | null;
        }

        /** Represents a Haplotype. */
        class Haplotype implements IHaplotype {
          /**
           * Constructs a new Haplotype.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IHaplotype);

          /** Haplotype _id. */
          public _id: string;

          /** Haplotype members. */
          public members: org.ga4gh.vrs.v1.Haplotype.IMember[];

          /**
           * Creates a new Haplotype instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Haplotype instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IHaplotype
          ): org.ga4gh.vrs.v1.Haplotype;

          /**
           * Encodes the specified Haplotype message. Does not implicitly {@link org.ga4gh.vrs.v1.Haplotype.verify|verify} messages.
           * @param message Haplotype message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IHaplotype,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Haplotype message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Haplotype.verify|verify} messages.
           * @param message Haplotype message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IHaplotype,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Haplotype message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Haplotype
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Haplotype;

          /**
           * Decodes a Haplotype message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Haplotype
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Haplotype;

          /**
           * Verifies a Haplotype message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Haplotype message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Haplotype
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Haplotype;

          /**
           * Creates a plain object from a Haplotype message. Also converts values to other types if specified.
           * @param message Haplotype
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Haplotype,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Haplotype to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Haplotype
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace Haplotype {
          /** Properties of a Member. */
          interface IMember {
            /** Member allele */
            allele?: org.ga4gh.vrs.v1.IAllele | null;

            /** Member curie */
            curie?: string | null;
          }

          /** Represents a Member. */
          class Member implements IMember {
            /**
             * Constructs a new Member.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.ga4gh.vrs.v1.Haplotype.IMember);

            /** Member allele. */
            public allele?: org.ga4gh.vrs.v1.IAllele | null;

            /** Member curie. */
            public curie?: string | null;

            /** Member value. */
            public value?: "allele" | "curie";

            /**
             * Creates a new Member instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Member instance
             */
            public static create(
              properties?: org.ga4gh.vrs.v1.Haplotype.IMember
            ): org.ga4gh.vrs.v1.Haplotype.Member;

            /**
             * Encodes the specified Member message. Does not implicitly {@link org.ga4gh.vrs.v1.Haplotype.Member.verify|verify} messages.
             * @param message Member message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.ga4gh.vrs.v1.Haplotype.IMember,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Member message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Haplotype.Member.verify|verify} messages.
             * @param message Member message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.ga4gh.vrs.v1.Haplotype.IMember,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Member message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Member
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.ga4gh.vrs.v1.Haplotype.Member;

            /**
             * Decodes a Member message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Member
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.ga4gh.vrs.v1.Haplotype.Member;

            /**
             * Verifies a Member message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Member message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Member
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.ga4gh.vrs.v1.Haplotype.Member;

            /**
             * Creates a plain object from a Member message. Also converts values to other types if specified.
             * @param message Member
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.ga4gh.vrs.v1.Haplotype.Member,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Member to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Member
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }
        }

        /** Properties of a Text. */
        interface IText {
          /** Text _id */
          _id?: string | null;

          /** Text definition */
          definition?: string | null;
        }

        /** Represents a Text. */
        class Text implements IText {
          /**
           * Constructs a new Text.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IText);

          /** Text _id. */
          public _id: string;

          /** Text definition. */
          public definition: string;

          /**
           * Creates a new Text instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Text instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IText
          ): org.ga4gh.vrs.v1.Text;

          /**
           * Encodes the specified Text message. Does not implicitly {@link org.ga4gh.vrs.v1.Text.verify|verify} messages.
           * @param message Text message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IText,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Text message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Text.verify|verify} messages.
           * @param message Text message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IText,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Text message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Text
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Text;

          /**
           * Decodes a Text message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Text
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Text;

          /**
           * Verifies a Text message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Text message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Text
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Text;

          /**
           * Creates a plain object from a Text message. Also converts values to other types if specified.
           * @param message Text
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Text,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Text to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Text
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a VariationSet. */
        interface IVariationSet {
          /** VariationSet _id */
          _id?: string | null;

          /** VariationSet members */
          members?: org.ga4gh.vrs.v1.VariationSet.IMember[] | null;
        }

        /** Represents a VariationSet. */
        class VariationSet implements IVariationSet {
          /**
           * Constructs a new VariationSet.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IVariationSet);

          /** VariationSet _id. */
          public _id: string;

          /** VariationSet members. */
          public members: org.ga4gh.vrs.v1.VariationSet.IMember[];

          /**
           * Creates a new VariationSet instance using the specified properties.
           * @param [properties] Properties to set
           * @returns VariationSet instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IVariationSet
          ): org.ga4gh.vrs.v1.VariationSet;

          /**
           * Encodes the specified VariationSet message. Does not implicitly {@link org.ga4gh.vrs.v1.VariationSet.verify|verify} messages.
           * @param message VariationSet message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IVariationSet,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified VariationSet message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.VariationSet.verify|verify} messages.
           * @param message VariationSet message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IVariationSet,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a VariationSet message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns VariationSet
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.VariationSet;

          /**
           * Decodes a VariationSet message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns VariationSet
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.VariationSet;

          /**
           * Verifies a VariationSet message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a VariationSet message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns VariationSet
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.VariationSet;

          /**
           * Creates a plain object from a VariationSet message. Also converts values to other types if specified.
           * @param message VariationSet
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.VariationSet,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this VariationSet to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for VariationSet
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        namespace VariationSet {
          /** Properties of a Member. */
          interface IMember {
            /** Member curie */
            curie?: string | null;

            /** Member allele */
            allele?: org.ga4gh.vrs.v1.IAllele | null;

            /** Member haplotype */
            haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;

            /** Member copyNumber */
            copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;

            /** Member text */
            text?: org.ga4gh.vrs.v1.IText | null;

            /** Member variationSet */
            variationSet?: org.ga4gh.vrs.v1.IVariationSet | null;
          }

          /** Represents a Member. */
          class Member implements IMember {
            /**
             * Constructs a new Member.
             * @param [properties] Properties to set
             */
            constructor(properties?: org.ga4gh.vrs.v1.VariationSet.IMember);

            /** Member curie. */
            public curie?: string | null;

            /** Member allele. */
            public allele?: org.ga4gh.vrs.v1.IAllele | null;

            /** Member haplotype. */
            public haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;

            /** Member copyNumber. */
            public copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;

            /** Member text. */
            public text?: org.ga4gh.vrs.v1.IText | null;

            /** Member variationSet. */
            public variationSet?: org.ga4gh.vrs.v1.IVariationSet | null;

            /** Member value. */
            public value?:
              | "curie"
              | "allele"
              | "haplotype"
              | "copyNumber"
              | "text"
              | "variationSet";

            /**
             * Creates a new Member instance using the specified properties.
             * @param [properties] Properties to set
             * @returns Member instance
             */
            public static create(
              properties?: org.ga4gh.vrs.v1.VariationSet.IMember
            ): org.ga4gh.vrs.v1.VariationSet.Member;

            /**
             * Encodes the specified Member message. Does not implicitly {@link org.ga4gh.vrs.v1.VariationSet.Member.verify|verify} messages.
             * @param message Member message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encode(
              message: org.ga4gh.vrs.v1.VariationSet.IMember,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Encodes the specified Member message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.VariationSet.Member.verify|verify} messages.
             * @param message Member message or plain object to encode
             * @param [writer] Writer to encode to
             * @returns Writer
             */
            public static encodeDelimited(
              message: org.ga4gh.vrs.v1.VariationSet.IMember,
              writer?: $protobuf.Writer
            ): $protobuf.Writer;

            /**
             * Decodes a Member message from the specified reader or buffer.
             * @param reader Reader or buffer to decode from
             * @param [length] Message length if known beforehand
             * @returns Member
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decode(
              reader: $protobuf.Reader | Uint8Array,
              length?: number
            ): org.ga4gh.vrs.v1.VariationSet.Member;

            /**
             * Decodes a Member message from the specified reader or buffer, length delimited.
             * @param reader Reader or buffer to decode from
             * @returns Member
             * @throws {Error} If the payload is not a reader or valid buffer
             * @throws {$protobuf.util.ProtocolError} If required fields are missing
             */
            public static decodeDelimited(
              reader: $protobuf.Reader | Uint8Array
            ): org.ga4gh.vrs.v1.VariationSet.Member;

            /**
             * Verifies a Member message.
             * @param message Plain object to verify
             * @returns `null` if valid, otherwise the reason why it is not
             */
            public static verify(message: { [k: string]: any }): string | null;

            /**
             * Creates a Member message from a plain object. Also converts values to their respective internal types.
             * @param object Plain object
             * @returns Member
             */
            public static fromObject(object: {
              [k: string]: any;
            }): org.ga4gh.vrs.v1.VariationSet.Member;

            /**
             * Creates a plain object from a Member message. Also converts values to other types if specified.
             * @param message Member
             * @param [options] Conversion options
             * @returns Plain object
             */
            public static toObject(
              message: org.ga4gh.vrs.v1.VariationSet.Member,
              options?: $protobuf.IConversionOptions
            ): { [k: string]: any };

            /**
             * Converts this Member to JSON.
             * @returns JSON object
             */
            public toJSON(): { [k: string]: any };

            /**
             * Gets the default type url for Member
             * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
             * @returns The default type url
             */
            public static getTypeUrl(typeUrlPrefix?: string): string;
          }
        }

        /** Properties of an Abundance. */
        interface IAbundance {
          /** Abundance copyNumber */
          copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;
        }

        /** Represents an Abundance. */
        class Abundance implements IAbundance {
          /**
           * Constructs a new Abundance.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IAbundance);

          /** Abundance copyNumber. */
          public copyNumber?: org.ga4gh.vrs.v1.ICopyNumber | null;

          /** Abundance abundance. */
          public abundance?: "copyNumber";

          /**
           * Creates a new Abundance instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Abundance instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IAbundance
          ): org.ga4gh.vrs.v1.Abundance;

          /**
           * Encodes the specified Abundance message. Does not implicitly {@link org.ga4gh.vrs.v1.Abundance.verify|verify} messages.
           * @param message Abundance message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IAbundance,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Abundance message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Abundance.verify|verify} messages.
           * @param message Abundance message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IAbundance,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes an Abundance message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Abundance
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Abundance;

          /**
           * Decodes an Abundance message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Abundance
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Abundance;

          /**
           * Verifies an Abundance message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates an Abundance message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Abundance
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Abundance;

          /**
           * Creates a plain object from an Abundance message. Also converts values to other types if specified.
           * @param message Abundance
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Abundance,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Abundance to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Abundance
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CopyNumber. */
        interface ICopyNumber {
          /** CopyNumber _id */
          _id?: string | null;

          /** CopyNumber allele */
          allele?: org.ga4gh.vrs.v1.IAllele | null;

          /** CopyNumber haplotype */
          haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;

          /** CopyNumber gene */
          gene?: org.ga4gh.vrs.v1.IGene | null;

          /** CopyNumber literalSequenceExpression */
          literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** CopyNumber derivedSequenceExpression */
          derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** CopyNumber repeatedSequenceExpression */
          repeatedSequenceExpression?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression | null;

          /** CopyNumber curie */
          curie?: string | null;

          /** CopyNumber number */
          number?: org.ga4gh.vrs.v1.INumber | null;

          /** CopyNumber indefiniteRange */
          indefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** CopyNumber definiteRange */
          definiteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;
        }

        /** Represents a CopyNumber. */
        class CopyNumber implements ICopyNumber {
          /**
           * Constructs a new CopyNumber.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ICopyNumber);

          /** CopyNumber _id. */
          public _id: string;

          /** CopyNumber allele. */
          public allele?: org.ga4gh.vrs.v1.IAllele | null;

          /** CopyNumber haplotype. */
          public haplotype?: org.ga4gh.vrs.v1.IHaplotype | null;

          /** CopyNumber gene. */
          public gene?: org.ga4gh.vrs.v1.IGene | null;

          /** CopyNumber literalSequenceExpression. */
          public literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** CopyNumber derivedSequenceExpression. */
          public derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** CopyNumber repeatedSequenceExpression. */
          public repeatedSequenceExpression?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression | null;

          /** CopyNumber curie. */
          public curie?: string | null;

          /** CopyNumber number. */
          public number?: org.ga4gh.vrs.v1.INumber | null;

          /** CopyNumber indefiniteRange. */
          public indefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** CopyNumber definiteRange. */
          public definiteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;

          /** CopyNumber subject. */
          public subject?:
            | "allele"
            | "haplotype"
            | "gene"
            | "literalSequenceExpression"
            | "derivedSequenceExpression"
            | "repeatedSequenceExpression"
            | "curie";

          /** CopyNumber copies. */
          public copies?: "number" | "indefiniteRange" | "definiteRange";

          /**
           * Creates a new CopyNumber instance using the specified properties.
           * @param [properties] Properties to set
           * @returns CopyNumber instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ICopyNumber
          ): org.ga4gh.vrs.v1.CopyNumber;

          /**
           * Encodes the specified CopyNumber message. Does not implicitly {@link org.ga4gh.vrs.v1.CopyNumber.verify|verify} messages.
           * @param message CopyNumber message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ICopyNumber,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified CopyNumber message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.CopyNumber.verify|verify} messages.
           * @param message CopyNumber message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ICopyNumber,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a CopyNumber message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns CopyNumber
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.CopyNumber;

          /**
           * Decodes a CopyNumber message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns CopyNumber
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.CopyNumber;

          /**
           * Verifies a CopyNumber message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a CopyNumber message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns CopyNumber
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.CopyNumber;

          /**
           * Creates a plain object from a CopyNumber message. Also converts values to other types if specified.
           * @param message CopyNumber
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.CopyNumber,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this CopyNumber to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for CopyNumber
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Location. */
        interface ILocation {
          /** Location chromosomeLocation */
          chromosomeLocation?: org.ga4gh.vrs.v1.IChromosomeLocation | null;

          /** Location sequenceLocation */
          sequenceLocation?: org.ga4gh.vrs.v1.ISequenceLocation | null;
        }

        /** Represents a Location. */
        class Location implements ILocation {
          /**
           * Constructs a new Location.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ILocation);

          /** Location chromosomeLocation. */
          public chromosomeLocation?: org.ga4gh.vrs.v1.IChromosomeLocation | null;

          /** Location sequenceLocation. */
          public sequenceLocation?: org.ga4gh.vrs.v1.ISequenceLocation | null;

          /** Location location. */
          public location?: "chromosomeLocation" | "sequenceLocation";

          /**
           * Creates a new Location instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Location instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ILocation
          ): org.ga4gh.vrs.v1.Location;

          /**
           * Encodes the specified Location message. Does not implicitly {@link org.ga4gh.vrs.v1.Location.verify|verify} messages.
           * @param message Location message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ILocation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Location message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Location.verify|verify} messages.
           * @param message Location message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ILocation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Location message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Location
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Location;

          /**
           * Decodes a Location message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Location
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Location;

          /**
           * Verifies a Location message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Location message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Location
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Location;

          /**
           * Creates a plain object from a Location message. Also converts values to other types if specified.
           * @param message Location
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Location,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Location to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Location
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a ChromosomeLocation. */
        interface IChromosomeLocation {
          /** ChromosomeLocation _id */
          _id?: string | null;

          /** ChromosomeLocation speciesId */
          speciesId?: string | null;

          /** ChromosomeLocation chr */
          chr?: string | null;

          /** ChromosomeLocation interval */
          interval?: org.ga4gh.vrs.v1.ICytobandInterval | null;
        }

        /** Represents a ChromosomeLocation. */
        class ChromosomeLocation implements IChromosomeLocation {
          /**
           * Constructs a new ChromosomeLocation.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IChromosomeLocation);

          /** ChromosomeLocation _id. */
          public _id: string;

          /** ChromosomeLocation speciesId. */
          public speciesId: string;

          /** ChromosomeLocation chr. */
          public chr: string;

          /** ChromosomeLocation interval. */
          public interval?: org.ga4gh.vrs.v1.ICytobandInterval | null;

          /**
           * Creates a new ChromosomeLocation instance using the specified properties.
           * @param [properties] Properties to set
           * @returns ChromosomeLocation instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IChromosomeLocation
          ): org.ga4gh.vrs.v1.ChromosomeLocation;

          /**
           * Encodes the specified ChromosomeLocation message. Does not implicitly {@link org.ga4gh.vrs.v1.ChromosomeLocation.verify|verify} messages.
           * @param message ChromosomeLocation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IChromosomeLocation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified ChromosomeLocation message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.ChromosomeLocation.verify|verify} messages.
           * @param message ChromosomeLocation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IChromosomeLocation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a ChromosomeLocation message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns ChromosomeLocation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.ChromosomeLocation;

          /**
           * Decodes a ChromosomeLocation message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns ChromosomeLocation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.ChromosomeLocation;

          /**
           * Verifies a ChromosomeLocation message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a ChromosomeLocation message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns ChromosomeLocation
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.ChromosomeLocation;

          /**
           * Creates a plain object from a ChromosomeLocation message. Also converts values to other types if specified.
           * @param message ChromosomeLocation
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.ChromosomeLocation,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this ChromosomeLocation to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for ChromosomeLocation
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SequenceLocation. */
        interface ISequenceLocation {
          /** SequenceLocation _id */
          _id?: string | null;

          /** SequenceLocation sequenceId */
          sequenceId?: string | null;

          /** SequenceLocation sequenceInterval */
          sequenceInterval?: org.ga4gh.vrs.v1.ISequenceInterval | null;

          /** SequenceLocation simpleInterval */
          simpleInterval?: org.ga4gh.vrs.v1.ISimpleInterval | null;
        }

        /** Represents a SequenceLocation. */
        class SequenceLocation implements ISequenceLocation {
          /**
           * Constructs a new SequenceLocation.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ISequenceLocation);

          /** SequenceLocation _id. */
          public _id: string;

          /** SequenceLocation sequenceId. */
          public sequenceId: string;

          /** SequenceLocation sequenceInterval. */
          public sequenceInterval?: org.ga4gh.vrs.v1.ISequenceInterval | null;

          /** SequenceLocation simpleInterval. */
          public simpleInterval?: org.ga4gh.vrs.v1.ISimpleInterval | null;

          /** SequenceLocation interval. */
          public interval?: "sequenceInterval" | "simpleInterval";

          /**
           * Creates a new SequenceLocation instance using the specified properties.
           * @param [properties] Properties to set
           * @returns SequenceLocation instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ISequenceLocation
          ): org.ga4gh.vrs.v1.SequenceLocation;

          /**
           * Encodes the specified SequenceLocation message. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceLocation.verify|verify} messages.
           * @param message SequenceLocation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ISequenceLocation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified SequenceLocation message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceLocation.verify|verify} messages.
           * @param message SequenceLocation message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ISequenceLocation,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a SequenceLocation message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns SequenceLocation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.SequenceLocation;

          /**
           * Decodes a SequenceLocation message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns SequenceLocation
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.SequenceLocation;

          /**
           * Verifies a SequenceLocation message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a SequenceLocation message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns SequenceLocation
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.SequenceLocation;

          /**
           * Creates a plain object from a SequenceLocation message. Also converts values to other types if specified.
           * @param message SequenceLocation
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.SequenceLocation,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this SequenceLocation to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for SequenceLocation
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SequenceInterval. */
        interface ISequenceInterval {
          /** SequenceInterval startNumber */
          startNumber?: org.ga4gh.vrs.v1.INumber | null;

          /** SequenceInterval startIndefiniteRange */
          startIndefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** SequenceInterval startDefiniteRange */
          startDefiniteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;

          /** SequenceInterval endNumber */
          endNumber?: org.ga4gh.vrs.v1.INumber | null;

          /** SequenceInterval endIndefiniteRange */
          endIndefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** SequenceInterval endDefiniteRange */
          endDefiniteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;
        }

        /** Represents a SequenceInterval. */
        class SequenceInterval implements ISequenceInterval {
          /**
           * Constructs a new SequenceInterval.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ISequenceInterval);

          /** SequenceInterval startNumber. */
          public startNumber?: org.ga4gh.vrs.v1.INumber | null;

          /** SequenceInterval startIndefiniteRange. */
          public startIndefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** SequenceInterval startDefiniteRange. */
          public startDefiniteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;

          /** SequenceInterval endNumber. */
          public endNumber?: org.ga4gh.vrs.v1.INumber | null;

          /** SequenceInterval endIndefiniteRange. */
          public endIndefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** SequenceInterval endDefiniteRange. */
          public endDefiniteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;

          /** SequenceInterval start. */
          public start?:
            | "startNumber"
            | "startIndefiniteRange"
            | "startDefiniteRange";

          /** SequenceInterval end. */
          public end?: "endNumber" | "endIndefiniteRange" | "endDefiniteRange";

          /**
           * Creates a new SequenceInterval instance using the specified properties.
           * @param [properties] Properties to set
           * @returns SequenceInterval instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ISequenceInterval
          ): org.ga4gh.vrs.v1.SequenceInterval;

          /**
           * Encodes the specified SequenceInterval message. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceInterval.verify|verify} messages.
           * @param message SequenceInterval message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ISequenceInterval,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified SequenceInterval message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceInterval.verify|verify} messages.
           * @param message SequenceInterval message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ISequenceInterval,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a SequenceInterval message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns SequenceInterval
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.SequenceInterval;

          /**
           * Decodes a SequenceInterval message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns SequenceInterval
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.SequenceInterval;

          /**
           * Verifies a SequenceInterval message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a SequenceInterval message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns SequenceInterval
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.SequenceInterval;

          /**
           * Creates a plain object from a SequenceInterval message. Also converts values to other types if specified.
           * @param message SequenceInterval
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.SequenceInterval,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this SequenceInterval to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for SequenceInterval
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a CytobandInterval. */
        interface ICytobandInterval {
          /** CytobandInterval start */
          start?: string | null;

          /** CytobandInterval end */
          end?: string | null;
        }

        /** Represents a CytobandInterval. */
        class CytobandInterval implements ICytobandInterval {
          /**
           * Constructs a new CytobandInterval.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ICytobandInterval);

          /** CytobandInterval start. */
          public start: string;

          /** CytobandInterval end. */
          public end: string;

          /**
           * Creates a new CytobandInterval instance using the specified properties.
           * @param [properties] Properties to set
           * @returns CytobandInterval instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ICytobandInterval
          ): org.ga4gh.vrs.v1.CytobandInterval;

          /**
           * Encodes the specified CytobandInterval message. Does not implicitly {@link org.ga4gh.vrs.v1.CytobandInterval.verify|verify} messages.
           * @param message CytobandInterval message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ICytobandInterval,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified CytobandInterval message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.CytobandInterval.verify|verify} messages.
           * @param message CytobandInterval message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ICytobandInterval,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a CytobandInterval message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns CytobandInterval
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.CytobandInterval;

          /**
           * Decodes a CytobandInterval message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns CytobandInterval
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.CytobandInterval;

          /**
           * Verifies a CytobandInterval message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a CytobandInterval message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns CytobandInterval
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.CytobandInterval;

          /**
           * Creates a plain object from a CytobandInterval message. Also converts values to other types if specified.
           * @param message CytobandInterval
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.CytobandInterval,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this CytobandInterval to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for CytobandInterval
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SequenceExpression. */
        interface ISequenceExpression {
          /** SequenceExpression literalSequenceExpression */
          literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** SequenceExpression derivedSequenceExpression */
          derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** SequenceExpression repeatedSequenceExpression */
          repeatedSequenceExpression?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression | null;
        }

        /** Represents a SequenceExpression. */
        class SequenceExpression implements ISequenceExpression {
          /**
           * Constructs a new SequenceExpression.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ISequenceExpression);

          /** SequenceExpression literalSequenceExpression. */
          public literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** SequenceExpression derivedSequenceExpression. */
          public derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** SequenceExpression repeatedSequenceExpression. */
          public repeatedSequenceExpression?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression | null;

          /** SequenceExpression sequenceExpression. */
          public sequenceExpression?:
            | "literalSequenceExpression"
            | "derivedSequenceExpression"
            | "repeatedSequenceExpression";

          /**
           * Creates a new SequenceExpression instance using the specified properties.
           * @param [properties] Properties to set
           * @returns SequenceExpression instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ISequenceExpression
          ): org.ga4gh.vrs.v1.SequenceExpression;

          /**
           * Encodes the specified SequenceExpression message. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceExpression.verify|verify} messages.
           * @param message SequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ISequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified SequenceExpression message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceExpression.verify|verify} messages.
           * @param message SequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ISequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a SequenceExpression message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns SequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.SequenceExpression;

          /**
           * Decodes a SequenceExpression message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns SequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.SequenceExpression;

          /**
           * Verifies a SequenceExpression message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a SequenceExpression message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns SequenceExpression
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.SequenceExpression;

          /**
           * Creates a plain object from a SequenceExpression message. Also converts values to other types if specified.
           * @param message SequenceExpression
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.SequenceExpression,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this SequenceExpression to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for SequenceExpression
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a LiteralSequenceExpression. */
        interface ILiteralSequenceExpression {
          /** LiteralSequenceExpression sequence */
          sequence?: string | null;
        }

        /** Represents a LiteralSequenceExpression. */
        class LiteralSequenceExpression implements ILiteralSequenceExpression {
          /**
           * Constructs a new LiteralSequenceExpression.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ILiteralSequenceExpression);

          /** LiteralSequenceExpression sequence. */
          public sequence: string;

          /**
           * Creates a new LiteralSequenceExpression instance using the specified properties.
           * @param [properties] Properties to set
           * @returns LiteralSequenceExpression instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ILiteralSequenceExpression
          ): org.ga4gh.vrs.v1.LiteralSequenceExpression;

          /**
           * Encodes the specified LiteralSequenceExpression message. Does not implicitly {@link org.ga4gh.vrs.v1.LiteralSequenceExpression.verify|verify} messages.
           * @param message LiteralSequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ILiteralSequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified LiteralSequenceExpression message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.LiteralSequenceExpression.verify|verify} messages.
           * @param message LiteralSequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ILiteralSequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a LiteralSequenceExpression message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns LiteralSequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.LiteralSequenceExpression;

          /**
           * Decodes a LiteralSequenceExpression message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns LiteralSequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.LiteralSequenceExpression;

          /**
           * Verifies a LiteralSequenceExpression message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a LiteralSequenceExpression message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns LiteralSequenceExpression
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.LiteralSequenceExpression;

          /**
           * Creates a plain object from a LiteralSequenceExpression message. Also converts values to other types if specified.
           * @param message LiteralSequenceExpression
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.LiteralSequenceExpression,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this LiteralSequenceExpression to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for LiteralSequenceExpression
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DerivedSequenceExpression. */
        interface IDerivedSequenceExpression {
          /** DerivedSequenceExpression location */
          location?: org.ga4gh.vrs.v1.ISequenceLocation | null;

          /** DerivedSequenceExpression reverseComplement */
          reverseComplement?: boolean | null;
        }

        /** Represents a DerivedSequenceExpression. */
        class DerivedSequenceExpression implements IDerivedSequenceExpression {
          /**
           * Constructs a new DerivedSequenceExpression.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IDerivedSequenceExpression);

          /** DerivedSequenceExpression location. */
          public location?: org.ga4gh.vrs.v1.ISequenceLocation | null;

          /** DerivedSequenceExpression reverseComplement. */
          public reverseComplement: boolean;

          /**
           * Creates a new DerivedSequenceExpression instance using the specified properties.
           * @param [properties] Properties to set
           * @returns DerivedSequenceExpression instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IDerivedSequenceExpression
          ): org.ga4gh.vrs.v1.DerivedSequenceExpression;

          /**
           * Encodes the specified DerivedSequenceExpression message. Does not implicitly {@link org.ga4gh.vrs.v1.DerivedSequenceExpression.verify|verify} messages.
           * @param message DerivedSequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IDerivedSequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified DerivedSequenceExpression message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.DerivedSequenceExpression.verify|verify} messages.
           * @param message DerivedSequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IDerivedSequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a DerivedSequenceExpression message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns DerivedSequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.DerivedSequenceExpression;

          /**
           * Decodes a DerivedSequenceExpression message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns DerivedSequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.DerivedSequenceExpression;

          /**
           * Verifies a DerivedSequenceExpression message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a DerivedSequenceExpression message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns DerivedSequenceExpression
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.DerivedSequenceExpression;

          /**
           * Creates a plain object from a DerivedSequenceExpression message. Also converts values to other types if specified.
           * @param message DerivedSequenceExpression
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.DerivedSequenceExpression,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this DerivedSequenceExpression to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for DerivedSequenceExpression
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a RepeatedSequenceExpression. */
        interface IRepeatedSequenceExpression {
          /** RepeatedSequenceExpression literalSequenceExpression */
          literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** RepeatedSequenceExpression derivedSequenceExpression */
          derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** RepeatedSequenceExpression number */
          number?: org.ga4gh.vrs.v1.INumber | null;

          /** RepeatedSequenceExpression indefiniteRange */
          indefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** RepeatedSequenceExpression definiteRange */
          definiteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;
        }

        /** Represents a RepeatedSequenceExpression. */
        class RepeatedSequenceExpression
          implements IRepeatedSequenceExpression
        {
          /**
           * Constructs a new RepeatedSequenceExpression.
           * @param [properties] Properties to set
           */
          constructor(
            properties?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression
          );

          /** RepeatedSequenceExpression literalSequenceExpression. */
          public literalSequenceExpression?: org.ga4gh.vrs.v1.ILiteralSequenceExpression | null;

          /** RepeatedSequenceExpression derivedSequenceExpression. */
          public derivedSequenceExpression?: org.ga4gh.vrs.v1.IDerivedSequenceExpression | null;

          /** RepeatedSequenceExpression number. */
          public number?: org.ga4gh.vrs.v1.INumber | null;

          /** RepeatedSequenceExpression indefiniteRange. */
          public indefiniteRange?: org.ga4gh.vrs.v1.IIndefiniteRange | null;

          /** RepeatedSequenceExpression definiteRange. */
          public definiteRange?: org.ga4gh.vrs.v1.IDefiniteRange | null;

          /** RepeatedSequenceExpression seqExpr. */
          public seqExpr?:
            | "literalSequenceExpression"
            | "derivedSequenceExpression";

          /** RepeatedSequenceExpression count. */
          public count?: "number" | "indefiniteRange" | "definiteRange";

          /**
           * Creates a new RepeatedSequenceExpression instance using the specified properties.
           * @param [properties] Properties to set
           * @returns RepeatedSequenceExpression instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IRepeatedSequenceExpression
          ): org.ga4gh.vrs.v1.RepeatedSequenceExpression;

          /**
           * Encodes the specified RepeatedSequenceExpression message. Does not implicitly {@link org.ga4gh.vrs.v1.RepeatedSequenceExpression.verify|verify} messages.
           * @param message RepeatedSequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IRepeatedSequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified RepeatedSequenceExpression message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.RepeatedSequenceExpression.verify|verify} messages.
           * @param message RepeatedSequenceExpression message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IRepeatedSequenceExpression,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a RepeatedSequenceExpression message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns RepeatedSequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.RepeatedSequenceExpression;

          /**
           * Decodes a RepeatedSequenceExpression message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns RepeatedSequenceExpression
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.RepeatedSequenceExpression;

          /**
           * Verifies a RepeatedSequenceExpression message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a RepeatedSequenceExpression message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns RepeatedSequenceExpression
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.RepeatedSequenceExpression;

          /**
           * Creates a plain object from a RepeatedSequenceExpression message. Also converts values to other types if specified.
           * @param message RepeatedSequenceExpression
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.RepeatedSequenceExpression,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this RepeatedSequenceExpression to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for RepeatedSequenceExpression
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Feature. */
        interface IFeature {
          /** Feature gene */
          gene?: org.ga4gh.vrs.v1.IGene | null;
        }

        /** Represents a Feature. */
        class Feature implements IFeature {
          /**
           * Constructs a new Feature.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IFeature);

          /** Feature gene. */
          public gene?: org.ga4gh.vrs.v1.IGene | null;

          /** Feature feature. */
          public feature?: "gene";

          /**
           * Creates a new Feature instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Feature instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IFeature
          ): org.ga4gh.vrs.v1.Feature;

          /**
           * Encodes the specified Feature message. Does not implicitly {@link org.ga4gh.vrs.v1.Feature.verify|verify} messages.
           * @param message Feature message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IFeature,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Feature message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Feature.verify|verify} messages.
           * @param message Feature message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IFeature,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Feature message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Feature
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Feature;

          /**
           * Decodes a Feature message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Feature
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Feature;

          /**
           * Verifies a Feature message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Feature message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Feature
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Feature;

          /**
           * Creates a plain object from a Feature message. Also converts values to other types if specified.
           * @param message Feature
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Feature,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Feature to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Feature
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Gene. */
        interface IGene {
          /** Gene geneId */
          geneId?: string | null;
        }

        /** Represents a Gene. */
        class Gene implements IGene {
          /**
           * Constructs a new Gene.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IGene);

          /** Gene geneId. */
          public geneId: string;

          /**
           * Creates a new Gene instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Gene instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IGene
          ): org.ga4gh.vrs.v1.Gene;

          /**
           * Encodes the specified Gene message. Does not implicitly {@link org.ga4gh.vrs.v1.Gene.verify|verify} messages.
           * @param message Gene message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IGene,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Gene message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Gene.verify|verify} messages.
           * @param message Gene message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IGene,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Gene message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Gene
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Gene;

          /**
           * Decodes a Gene message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Gene
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Gene;

          /**
           * Verifies a Gene message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Gene message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Gene
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Gene;

          /**
           * Creates a plain object from a Gene message. Also converts values to other types if specified.
           * @param message Gene
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Gene,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Gene to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Gene
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a Number. */
        interface INumber {
          /** Number value */
          value?: number | Long | null;
        }

        /** Represents a Number. */
        class Number implements INumber {
          /**
           * Constructs a new Number.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.INumber);

          /** Number value. */
          public value: number | Long;

          /**
           * Creates a new Number instance using the specified properties.
           * @param [properties] Properties to set
           * @returns Number instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.INumber
          ): org.ga4gh.vrs.v1.Number;

          /**
           * Encodes the specified Number message. Does not implicitly {@link org.ga4gh.vrs.v1.Number.verify|verify} messages.
           * @param message Number message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.INumber,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified Number message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.Number.verify|verify} messages.
           * @param message Number message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.INumber,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a Number message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns Number
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.Number;

          /**
           * Decodes a Number message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns Number
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.Number;

          /**
           * Verifies a Number message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a Number message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns Number
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.Number;

          /**
           * Creates a plain object from a Number message. Also converts values to other types if specified.
           * @param message Number
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.Number,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this Number to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for Number
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of an IndefiniteRange. */
        interface IIndefiniteRange {
          /** IndefiniteRange value */
          value?: number | Long | null;

          /** IndefiniteRange comparator */
          comparator?: string | null;
        }

        /** Represents an IndefiniteRange. */
        class IndefiniteRange implements IIndefiniteRange {
          /**
           * Constructs a new IndefiniteRange.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IIndefiniteRange);

          /** IndefiniteRange value. */
          public value: number | Long;

          /** IndefiniteRange comparator. */
          public comparator: string;

          /**
           * Creates a new IndefiniteRange instance using the specified properties.
           * @param [properties] Properties to set
           * @returns IndefiniteRange instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IIndefiniteRange
          ): org.ga4gh.vrs.v1.IndefiniteRange;

          /**
           * Encodes the specified IndefiniteRange message. Does not implicitly {@link org.ga4gh.vrs.v1.IndefiniteRange.verify|verify} messages.
           * @param message IndefiniteRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IIndefiniteRange,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified IndefiniteRange message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.IndefiniteRange.verify|verify} messages.
           * @param message IndefiniteRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IIndefiniteRange,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes an IndefiniteRange message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns IndefiniteRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.IndefiniteRange;

          /**
           * Decodes an IndefiniteRange message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns IndefiniteRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.IndefiniteRange;

          /**
           * Verifies an IndefiniteRange message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates an IndefiniteRange message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns IndefiniteRange
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.IndefiniteRange;

          /**
           * Creates a plain object from an IndefiniteRange message. Also converts values to other types if specified.
           * @param message IndefiniteRange
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.IndefiniteRange,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this IndefiniteRange to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for IndefiniteRange
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a DefiniteRange. */
        interface IDefiniteRange {
          /** DefiniteRange min */
          min?: number | Long | null;

          /** DefiniteRange max */
          max?: number | Long | null;
        }

        /** Represents a DefiniteRange. */
        class DefiniteRange implements IDefiniteRange {
          /**
           * Constructs a new DefiniteRange.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.IDefiniteRange);

          /** DefiniteRange min. */
          public min: number | Long;

          /** DefiniteRange max. */
          public max: number | Long;

          /**
           * Creates a new DefiniteRange instance using the specified properties.
           * @param [properties] Properties to set
           * @returns DefiniteRange instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.IDefiniteRange
          ): org.ga4gh.vrs.v1.DefiniteRange;

          /**
           * Encodes the specified DefiniteRange message. Does not implicitly {@link org.ga4gh.vrs.v1.DefiniteRange.verify|verify} messages.
           * @param message DefiniteRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.IDefiniteRange,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified DefiniteRange message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.DefiniteRange.verify|verify} messages.
           * @param message DefiniteRange message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.IDefiniteRange,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a DefiniteRange message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns DefiniteRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.DefiniteRange;

          /**
           * Decodes a DefiniteRange message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns DefiniteRange
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.DefiniteRange;

          /**
           * Verifies a DefiniteRange message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a DefiniteRange message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns DefiniteRange
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.DefiniteRange;

          /**
           * Creates a plain object from a DefiniteRange message. Also converts values to other types if specified.
           * @param message DefiniteRange
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.DefiniteRange,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this DefiniteRange to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for DefiniteRange
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SequenceState. */
        interface ISequenceState {
          /** SequenceState sequence */
          sequence?: string | null;
        }

        /** Represents a SequenceState. */
        class SequenceState implements ISequenceState {
          /**
           * Constructs a new SequenceState.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ISequenceState);

          /** SequenceState sequence. */
          public sequence: string;

          /**
           * Creates a new SequenceState instance using the specified properties.
           * @param [properties] Properties to set
           * @returns SequenceState instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ISequenceState
          ): org.ga4gh.vrs.v1.SequenceState;

          /**
           * Encodes the specified SequenceState message. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceState.verify|verify} messages.
           * @param message SequenceState message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ISequenceState,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified SequenceState message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.SequenceState.verify|verify} messages.
           * @param message SequenceState message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ISequenceState,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a SequenceState message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns SequenceState
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.SequenceState;

          /**
           * Decodes a SequenceState message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns SequenceState
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.SequenceState;

          /**
           * Verifies a SequenceState message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a SequenceState message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns SequenceState
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.SequenceState;

          /**
           * Creates a plain object from a SequenceState message. Also converts values to other types if specified.
           * @param message SequenceState
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.SequenceState,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this SequenceState to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for SequenceState
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }

        /** Properties of a SimpleInterval. */
        interface ISimpleInterval {
          /** SimpleInterval start */
          start?: number | Long | null;

          /** SimpleInterval end */
          end?: number | Long | null;
        }

        /** Represents a SimpleInterval. */
        class SimpleInterval implements ISimpleInterval {
          /**
           * Constructs a new SimpleInterval.
           * @param [properties] Properties to set
           */
          constructor(properties?: org.ga4gh.vrs.v1.ISimpleInterval);

          /** SimpleInterval start. */
          public start: number | Long;

          /** SimpleInterval end. */
          public end: number | Long;

          /**
           * Creates a new SimpleInterval instance using the specified properties.
           * @param [properties] Properties to set
           * @returns SimpleInterval instance
           */
          public static create(
            properties?: org.ga4gh.vrs.v1.ISimpleInterval
          ): org.ga4gh.vrs.v1.SimpleInterval;

          /**
           * Encodes the specified SimpleInterval message. Does not implicitly {@link org.ga4gh.vrs.v1.SimpleInterval.verify|verify} messages.
           * @param message SimpleInterval message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encode(
            message: org.ga4gh.vrs.v1.ISimpleInterval,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Encodes the specified SimpleInterval message, length delimited. Does not implicitly {@link org.ga4gh.vrs.v1.SimpleInterval.verify|verify} messages.
           * @param message SimpleInterval message or plain object to encode
           * @param [writer] Writer to encode to
           * @returns Writer
           */
          public static encodeDelimited(
            message: org.ga4gh.vrs.v1.ISimpleInterval,
            writer?: $protobuf.Writer
          ): $protobuf.Writer;

          /**
           * Decodes a SimpleInterval message from the specified reader or buffer.
           * @param reader Reader or buffer to decode from
           * @param [length] Message length if known beforehand
           * @returns SimpleInterval
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decode(
            reader: $protobuf.Reader | Uint8Array,
            length?: number
          ): org.ga4gh.vrs.v1.SimpleInterval;

          /**
           * Decodes a SimpleInterval message from the specified reader or buffer, length delimited.
           * @param reader Reader or buffer to decode from
           * @returns SimpleInterval
           * @throws {Error} If the payload is not a reader or valid buffer
           * @throws {$protobuf.util.ProtocolError} If required fields are missing
           */
          public static decodeDelimited(
            reader: $protobuf.Reader | Uint8Array
          ): org.ga4gh.vrs.v1.SimpleInterval;

          /**
           * Verifies a SimpleInterval message.
           * @param message Plain object to verify
           * @returns `null` if valid, otherwise the reason why it is not
           */
          public static verify(message: { [k: string]: any }): string | null;

          /**
           * Creates a SimpleInterval message from a plain object. Also converts values to their respective internal types.
           * @param object Plain object
           * @returns SimpleInterval
           */
          public static fromObject(object: {
            [k: string]: any;
          }): org.ga4gh.vrs.v1.SimpleInterval;

          /**
           * Creates a plain object from a SimpleInterval message. Also converts values to other types if specified.
           * @param message SimpleInterval
           * @param [options] Conversion options
           * @returns Plain object
           */
          public static toObject(
            message: org.ga4gh.vrs.v1.SimpleInterval,
            options?: $protobuf.IConversionOptions
          ): { [k: string]: any };

          /**
           * Converts this SimpleInterval to JSON.
           * @returns JSON object
           */
          public toJSON(): { [k: string]: any };

          /**
           * Gets the default type url for SimpleInterval
           * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
           * @returns The default type url
           */
          public static getTypeUrl(typeUrlPrefix?: string): string;
        }
      }
    }
  }
}

/** Namespace google. */
export namespace google {
  /** Namespace protobuf. */
  namespace protobuf {
    /** Properties of a Timestamp. */
    interface ITimestamp {
      /** Timestamp seconds */
      seconds?: number | Long | null;

      /** Timestamp nanos */
      nanos?: number | null;
    }

    /** Represents a Timestamp. */
    class Timestamp implements ITimestamp {
      /**
       * Constructs a new Timestamp.
       * @param [properties] Properties to set
       */
      constructor(properties?: google.protobuf.ITimestamp);

      /** Timestamp seconds. */
      public seconds: number | Long;

      /** Timestamp nanos. */
      public nanos: number;

      /**
       * Creates a new Timestamp instance using the specified properties.
       * @param [properties] Properties to set
       * @returns Timestamp instance
       */
      public static create(
        properties?: google.protobuf.ITimestamp
      ): google.protobuf.Timestamp;

      /**
       * Encodes the specified Timestamp message. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
       * @param message Timestamp message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encode(
        message: google.protobuf.ITimestamp,
        writer?: $protobuf.Writer
      ): $protobuf.Writer;

      /**
       * Encodes the specified Timestamp message, length delimited. Does not implicitly {@link google.protobuf.Timestamp.verify|verify} messages.
       * @param message Timestamp message or plain object to encode
       * @param [writer] Writer to encode to
       * @returns Writer
       */
      public static encodeDelimited(
        message: google.protobuf.ITimestamp,
        writer?: $protobuf.Writer
      ): $protobuf.Writer;

      /**
       * Decodes a Timestamp message from the specified reader or buffer.
       * @param reader Reader or buffer to decode from
       * @param [length] Message length if known beforehand
       * @returns Timestamp
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decode(
        reader: $protobuf.Reader | Uint8Array,
        length?: number
      ): google.protobuf.Timestamp;

      /**
       * Decodes a Timestamp message from the specified reader or buffer, length delimited.
       * @param reader Reader or buffer to decode from
       * @returns Timestamp
       * @throws {Error} If the payload is not a reader or valid buffer
       * @throws {$protobuf.util.ProtocolError} If required fields are missing
       */
      public static decodeDelimited(
        reader: $protobuf.Reader | Uint8Array
      ): google.protobuf.Timestamp;

      /**
       * Verifies a Timestamp message.
       * @param message Plain object to verify
       * @returns `null` if valid, otherwise the reason why it is not
       */
      public static verify(message: { [k: string]: any }): string | null;

      /**
       * Creates a Timestamp message from a plain object. Also converts values to their respective internal types.
       * @param object Plain object
       * @returns Timestamp
       */
      public static fromObject(object: {
        [k: string]: any;
      }): google.protobuf.Timestamp;

      /**
       * Creates a plain object from a Timestamp message. Also converts values to other types if specified.
       * @param message Timestamp
       * @param [options] Conversion options
       * @returns Plain object
       */
      public static toObject(
        message: google.protobuf.Timestamp,
        options?: $protobuf.IConversionOptions
      ): { [k: string]: any };

      /**
       * Converts this Timestamp to JSON.
       * @returns JSON object
       */
      public toJSON(): { [k: string]: any };

      /**
       * Gets the default type url for Timestamp
       * @param [typeUrlPrefix] your custom typeUrlPrefix(default "type.googleapis.com")
       * @returns The default type url
       */
      public static getTypeUrl(typeUrlPrefix?: string): string;
    }
  }
}
